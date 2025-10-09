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
  providedIn: 'root', // Este servicio se inyecta en el root, por eso va en CoreModule
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/dashboard'; // URL base de tu API NestJS
  private filterUrl = 'http://localhost:3000/filters'; // URL para obtener las listas de filtros

  constructor(private http: HttpClient) {}

  // Helper para construir los parámetros de la URL
  private buildParams(filters?: DashboardFilters): HttpParams {
    let params = new HttpParams();
    if (filters) {
      if (filters.id_distrito_federal) {
        params = params.set('id_distrito_federal', filters.id_distrito_federal);
      }
      if (filters.id_distrito_local) {
        params = params.set('id_distrito_local', filters.id_distrito_local);
      }
      if (filters.id_municipio) {
        params = params.set('id_municipio', filters.id_municipio);
      }
    }
    return params;
  }

  getKpisGenerales(filters?: DashboardFilters): Observable<KpisGenerales> {
    const params = this.buildParams(filters);
    return this.http.get<KpisGenerales>(`${this.apiUrl}/kpis-generales`, {
      params,
    });
  }

  getGraficosDemograficos(
    filters?: DashboardFilters
  ): Observable<GraficosDemograficos> {
    const params = this.buildParams(filters);
    return this.http.get<GraficosDemograficos>(
      `${this.apiUrl}/graficos-demograficos`,
      { params }
    );
  }

  getPreferencias(filters?: DashboardFilters): Observable<Preferencia[]> {
    // 2. El método ahora devuelve un array
    const params = this.buildParams(filters);
    return this.http
      .get<PreferenciasResponse>(`${this.apiUrl}/preferencias`, { params }) // 3. Espera el objeto de respuesta
      .pipe(
        map((response) => response.preferencias) // 4. Extrae solo el array de adentro
      );
  }

  getUbicaciones(filters?: DashboardFilters): Observable<Ubicacion[]> {
    const params = this.buildParams(filters);
    return this.http.get<Ubicacion[]>(`${this.apiUrl}/ubicaciones`, { params });
  }

  // Métodos para obtener las listas de filtros
  getDistritosFederales(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.filterUrl}/distritos-federales`);
  }

  //El método ahora acepta un ID opcional
  getDistritosLocales(idDF?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idDF && idDF !== 'all') {
      params = params.set('id_distrito_federal', idDF);
    }
    return this.http.get<Region[]>(`${this.filterUrl}/distritos-locales`, {
      params,
    });
  }

  //El método ahora acepta un ID opcional
  getMunicipios(idDL?: string): Observable<Region[]> {
    let params = new HttpParams();
    if (idDL && idDL !== 'all') {
      params = params.set('id_distrito_local', idDL);
    }
    return this.http.get<Region[]>(`${this.filterUrl}/municipios`, { params });
  }
}
