// src/app/core/services/api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardFilters,
  KpisGenerales,
  GraficosDemograficos,
  Preferencias,
  Ubicacion,
  Region,
} from '../../shared/models/dashboard.models';

@Injectable({
  providedIn: 'root' // Este servicio se inyecta en el root, por eso va en CoreModule
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
    return this.http.get<KpisGenerales>(`${this.apiUrl}/kpis-generales`, { params });
  }

  getGraficosDemograficos(filters?: DashboardFilters): Observable<GraficosDemograficos> {
    const params = this.buildParams(filters);
    return this.http.get<GraficosDemograficos>(`${this.apiUrl}/graficos-demograficos`, { params });
  }

  getPreferencias(filters?: DashboardFilters): Observable<Preferencias> {
    const params = this.buildParams(filters);
    return this.http.get<Preferencias>(`${this.apiUrl}/preferencias`, { params });
  }

  getUbicaciones(filters?: DashboardFilters): Observable<Ubicacion[]> {
    const params = this.buildParams(filters);
    return this.http.get<Ubicacion[]>(`${this.apiUrl}/ubicaciones`, { params });
  }

  // --- Métodos para obtener los datos de los filtros ---
  // AÚN NO HEMOS CREADO ESTOS ENDPOINTS EN NESTJS, SON UN PASO FUTURO.
  // Por ahora, devolverán datos dummy o vacíos.
  getDistritosFederales(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.filterUrl}/distritos-federales`);
  }

  getDistritosLocales(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.filterUrl}/distritos-locales`);
  }

  getMunicipios(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.filterUrl}/municipios`);
  }
}
