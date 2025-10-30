// src/app/shared/models/dashboard.models.ts

// Para los filtros de los desplegables geográficos
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

// Interfaces para los datos que vienen de getUbicaciones
export interface Ubicacion {
  latitud: string;
  longitud: string;
}

// DTO para enviar filtros al backend (Versión corregida)
export interface DashboardFilters {
  // Filtros geográficos (todos opcionales y de tipo string)
  id_estado?: string;
  id_distrito_federal?: string;
  id_distrito_local?: string;
  id_municipio?: string;
  id_seccion?: string;
  id_comunidad?: string;

  // Filtro de respuestas (tipo objeto o indefinido)
  answerFilters?: { [questionId: string]: string[] };
}

// Para los resultados de los gráficos dinámicos
export interface QuestionResultDto {
  label: string;
  value: number;
}


// --- Interfaces movidas aquí desde api.service.ts ---

/**
 * Define la estructura de una pregunta de la encuesta
 * (usado en el sidebar de filtros)
 */
export interface SurveyQuestion {
  id_pregunta: number;
  texto_pregunta: string;
}

/**
 * Define la estructura de una opción de respuesta
 * (usado para los checkboxes del sidebar de filtros)
 */
export interface QuestionOption {
  id_opcion: string;
  texto_opcion: string;
}


// --- Interfaces Obsoletas Eliminadas ---
// Ya no necesitamos GraficosDemograficos, Preferencia, ni PreferenciasResponse
// porque todo se maneja con SurveyQuestion y QuestionResultDto
