import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  DashboardFilters,
  KpisGenerales,
  Ubicacion,
  Region,
  QuestionResultDto,
  SurveyQuestion, // Importado desde los modelos
  QuestionOption, // Importado desde los modelos
} from '../../shared/models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://q5nl1uog2m.execute-api.mx-central-1.amazonaws.com/dev'; // URL de Vercel
  //private baseUrl = 'http://localhost:3000'; // URL local

  constructor(private http: HttpClient) {}

  /**
   * Construye los HttpParams de forma segura, separando la lógica
   * de los filtros geográficos y los filtros de respuesta.
   */
  private buildParams(filters?: DashboardFilters): HttpParams {
    let params = new HttpParams();
    if (!filters) {
      return params;
    }

    // 1. Manejar filtros geográficos estáticos (Forma segura y explícita)

    // 👇 Define un TIPO específico solo para las claves geográficas
    type GeoFilterKey =
      | 'id_estado'
      | 'id_distrito_federal'
      | 'id_distrito_local'
      | 'id_municipio'
      | 'id_seccion'
      | 'id_comunidad';

    // 👇 Usa ese TIPO para el array
    const geoKeys: GeoFilterKey[] = [
      'id_estado',
      'id_distrito_federal',
      'id_distrito_local',
      'id_municipio',
      'id_seccion',
      'id_comunidad',
    ];

    // Itera solo sobre las claves geográficas conocidas
    geoKeys.forEach((key) => {
      // Ahora TypeScript sabe que 'key' es GeoFilterKey,
      // por lo tanto 'filters[key]' solo puede ser 'string | undefined'
      const value = filters[key];
      if (value && value !== 'all') {
        params = params.set(key, value); // ✅ Esto ahora es 100% seguro y no da error
      }
    });

    // 2. Manejar filtro de respuestas (answerFilters)
    if (filters.answerFilters) {
      const answerFiltersString = JSON.stringify(filters.answerFilters);
      // Solo añade el parámetro si no es un objeto vacío
      if (answerFiltersString !== '{}') {
        params = params.set('answerFilters', answerFiltersString);
      }
    }

    return params;
  }

  // --- MÉTODOS DE API PRINCIPALES ---

  /**
   * Obtiene los KPIs. Ahora se filtra por geografía Y respuestas.
   */
  getKpisGenerales(filters?: DashboardFilters): Observable<KpisGenerales> {
    const params = this.buildParams(filters);
    return this.http.get<KpisGenerales>(
      `${this.baseUrl}/dashboard/kpis-generales`,
      { params }
    );
  }

  /**
   * Obtiene las ubicaciones. Ahora se filtra por geografía Y respuestas.
   */
  getUbicaciones(filters?: DashboardFilters): Observable<Ubicacion[]> {
    const params = this.buildParams(filters);
    return this.http.get<Ubicacion[]>(`${this.baseUrl}/dashboard/ubicaciones`, {
      params,
    });
  }

  /**
   * Obtiene los resultados de UNA pregunta. Ahora se filtra por geografía Y respuestas.
   */
  getQuestionResults(
    idPregunta: number,
    filters?: DashboardFilters
  ): Observable<QuestionResultDto[]> {
    const params = this.buildParams(filters);
    return this.http.get<QuestionResultDto[]>(
      `${this.baseUrl}/dashboard/question-results/${idPregunta}`,
      { params }
    );
  }

  // --- MÉTODOS PARA OBTENER OPCIONES DE FILTROS ---

  getEstados(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/filters/estados`);
  }

  getDistritosFederales(idEstado?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idEstado && idEstado !== 'all') {
      params = params.set('id_estado', idEstado);
    }
    return this.http.get<Region[]>(
      `${this.baseUrl}/filters/distritos-federales`,
      { params }
    );
  }

  getDistritosLocales(idDF?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idDF && idDF !== 'all') {
      params = params.set('id_distrito_federal', idDF);
    }
    return this.http.get<Region[]>(
      `${this.baseUrl}/filters/distritos-locales`,
      { params }
    );
  }

  getMunicipios(idDL?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idDL && idDL !== 'all') {
      params = params.set('id_distrito_local', idDL);
    }
    return this.http.get<Region[]>(`${this.baseUrl}/filters/municipios`, {
      params,
    });
  }

  getSecciones(idMunicipio?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idMunicipio && idMunicipio !== 'all') {
      params = params.set('id_municipio', idMunicipio);
    }
    return this.http.get<Region[]>(`${this.baseUrl}/filters/secciones`, {
      params,
    });
  }

  getComunidades(idSeccion?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idSeccion && idSeccion !== 'all') {
      params = params.set('id_seccion', idSeccion);
    }
    return this.http.get<Region[]>(`${this.baseUrl}/filters/comunidades`, {
      params,
    });
  }

  /**
   * Obtiene la lista de todas las preguntas de la encuesta.
   */
  getSurveyQuestions(idEncuesta: number = 9): Observable<SurveyQuestion[]> {
    return this.http.get<SurveyQuestion[]>(`${this.baseUrl}/filters/questions`);
  }

  /**
   * Obtiene las opciones (checkboxes) para una pregunta específica.
   */
  getOptionsForQuestion(idPregunta: number): Observable<QuestionOption[]> {
    return this.http.get<QuestionOption[]>(
      `${this.baseUrl}/filters/options/${idPregunta}`
    );
  }

  // --- MÉTODOS OBSOLETOS ELIMINADOS ---
  // getGraficosDemograficos y getPreferencias ya no son necesarios
}
