import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  DashboardFilters,
  KpisGenerales,
  GraficosDemograficos,
  Preferencia,
  PreferenciasResponse,
  Ubicacion,
  Region,
} from '../../shared/models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://data-link-api.vercel.app';

  constructor(private http: HttpClient) {}

  // Función auxiliar para construir parámetros (mejorada y segura)
  private buildParams(filters?: DashboardFilters): HttpParams {
    let params = new HttpParams();
    if (filters) {
      // Itera sobre las llaves del objeto de filtros
      (Object.keys(filters) as Array<keyof DashboardFilters>).forEach(key => {
        // Solo añade el parámetro si la llave existe, tiene valor y no es 'all'
        if (filters[key] && filters[key] !== 'all') {
          // Convierte la llave y el valor a string para cumplir la firma de HttpParams.set
          params = params.set(String(key), String(filters[key]));
        }
      });
    }
    return params;
  }

  // --- Métodos de la API (usan this.baseUrl) ---

  getKpisGenerales(filters?: DashboardFilters): Observable<KpisGenerales> {
    const params = this.buildParams(filters);
    // Construye la URL completa
    return this.http.get<KpisGenerales>(`${this.baseUrl}/dashboard/kpis-generales`, { params });
  }

  getGraficosDemograficos(filters?: DashboardFilters): Observable<GraficosDemograficos> {
    const params = this.buildParams(filters);
    // Construye la URL completa
    return this.http.get<GraficosDemograficos>(`${this.baseUrl}/dashboard/graficos-demograficos`, { params });
  }

  getPreferencias(filters?: DashboardFilters): Observable<Preferencia[]> {
    const params = this.buildParams(filters);
    // Construye la URL completa
    return this.http.get<PreferenciasResponse>(`${this.baseUrl}/dashboard/preferencias`, { params })
      .pipe(
        map(response => response.preferencias) // Extrae el array
      );
  }

  getUbicaciones(filters?: DashboardFilters): Observable<Ubicacion[]> {
    const params = this.buildParams(filters);
    // Construye la URL completa
    return this.http.get<Ubicacion[]>(`${this.baseUrl}/dashboard/ubicaciones`, { params });
  }

  // --- Endpoints de Filtros (usan this.baseUrl) ---

  getDistritosFederales(): Observable<Region[]> {
    // Construye la URL completa
    return this.http.get<Region[]>(`${this.baseUrl}/filters/distritos-federales`);
  }

  getDistritosLocales(idDF?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idDF && idDF !== 'all') {
      params = params.set('id_distrito_federal', idDF);
    }
    // Construye la URL completa
    return this.http.get<Region[]>(`${this.baseUrl}/filters/distritos-locales`, { params });
  }

  getMunicipios(idDL?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idDL && idDL !== 'all') {
      params = params.set('id_distrito_local', idDL);
    }
    // Construye la URL completa
    return this.http.get<Region[]>(`${this.baseUrl}/filters/municipios`, { params });
  }
}
