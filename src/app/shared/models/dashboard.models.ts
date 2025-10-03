// src/app/shared/models/dashboard.models.ts

// Para los filtros de los desplegables
export interface Region {
  id: string; // Puede ser id_municipio, id_distritolocal, etc.
  nombre: string;
}

// Interfaces para los datos que vienen de getKpisGenerales
export interface KpisGenerales {
  totalEncuestas: number;
  cobertura: {
    municipios: number;
    distritosLocales: number;
  };
  participacionGenero: {
    genero: string;
    total: string; // Viene como string del backend
  }[];
}

// Interfaces para los datos que vienen de getGraficosDemograficos
export interface GraficosDemograficos {
  distribucionEdad: {
    rango: string;
    total: string;
  }[];
  nivelEscolaridad: {
    nivel: string;
    total: string;
  }[];
  ocupacionPrincipal: {
    ocupacion: string;
    total: string;
  }[];
}

// Interfaces para los datos que vienen de getPreferencias
export interface Preferencias {
  candidato: string;
  total: string;
}[];

// Interfaces para los datos que vienen de getUbicaciones
export interface Ubicacion {
  latitud: string; // Asumo string del backend, ajustar si es number
  longitud: string; // Asumo string del backend, ajustar si es number
}

// DTO para enviar filtros al backend (similar al de NestJS)
export interface DashboardFilters {
  id_distrito_federal?: string;
  id_distrito_local?: string;
  id_municipio?: string;
}
