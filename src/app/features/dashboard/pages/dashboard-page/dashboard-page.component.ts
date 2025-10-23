import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../../shared/components/heatmap-map/heatmap-map.component';
import { PieChartComponent } from '../../../../shared/components/pie-chart/pie-chart.component';
import { BarChartComponent } from '../../../../shared/components/bar-chart/bar-chart.component';
import {
  DashboardFilters,
  KpisGenerales,
  GraficosDemograficos,
  Preferencia,
  Region,
  Ubicacion,
  QuestionResultDto
} from '../../../../shared/models/dashboard.models';
import { forkJoin, Observable } from 'rxjs';
import { GaugeChartComponent } from '../../../../shared/components/gauge-chart/gauge-chart.component';

// Interfaz para las preguntas de encuesta
interface SurveyQuestion {
  id_pregunta: number;
  texto_pregunta: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KpiCardComponent,
    HeatmapMapComponent,
    PieChartComponent,
    BarChartComponent,
    GaugeChartComponent
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent implements OnInit {
  // ---------------------- FILTROS ----------------------
  currentFilters: DashboardFilters = {
    id_estado: 'all',
    id_distrito_federal: 'all',
    id_distrito_local: 'all',
    id_municipio: 'all',
    id_seccion: 'all',
    id_comunidad: 'all'
  };

  estados: Region[] = [];
  distritosFederales: Region[] = [];
  distritosLocales: Region[] = [];
  municipios: Region[] = [];
  secciones: Region[] = [];
  comunidades: Region[] = [];

  // ---------------------- DATOS DASHBOARD ----------------------
  kpisGenerales: KpisGenerales | null = null;
  ubicaciones: Ubicacion[] = [];

  // ---------------------- PREGUNTAS Y RESULTADOS ----------------------
  surveyQuestions: SurveyQuestion[] = [];
  questionResults: { [key: number]: QuestionResultDto[] } = {};

  // ---------------------- ESTADOS DE CARGA ----------------------
  isLoading: boolean = false;
  isLoadingFilters: boolean = false;
  isLoadingQuestions: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadInitialFilterOptions();
    this.loadSurveyQuestions(); // Carga las preguntas al inicio
  }

  // ---------------------- CARGA INICIAL DE ESTADOS ----------------------
  loadInitialFilterOptions(): void {
    this.isLoadingFilters = true;
    this.apiService.getEstados().subscribe(data => {
      this.estados = data;
      if (data.length === 1) {
        this.currentFilters.id_estado = data[0].id;
        this.onEstadoChange();
      } else {
        this.isLoadingFilters = false;
      }
    });
  }

  // ---------------------- EVENTOS DE CASCADA ----------------------
  onEstadoChange(): void {
    this.resetFiltersBelow('estado');
    this.loadFilterOptions(['distritoFederal']);
    this.loadDynamicQuestionResults();
  }

  onFederalDistrictChange(): void {
    this.resetFiltersBelow('distritoFederal');
    this.loadFilterOptions(['distritoLocal']);
    this.loadDynamicQuestionResults();
  }

  onLocalDistrictChange(): void {
    this.resetFiltersBelow('distritoLocal');
    this.loadFilterOptions(['municipio']);
    this.loadDynamicQuestionResults();
  }

  onMunicipioChange(): void {
    this.resetFiltersBelow('municipio');
    this.loadFilterOptions(['seccion']);
    this.loadDynamicQuestionResults();
  }

  onSeccionChange(): void {
    this.resetFiltersBelow('seccion');
    this.loadFilterOptions(['comunidad']);
    this.loadDynamicQuestionResults();
  }

  onComunidadChange(): void {
    this.loadDynamicQuestionResults(); // Último nivel ya carga preguntas y KPIs
  }

  // ---------------------- CARGA FILTROS DINÁMICOS ----------------------
  loadFilterOptions(levels: string[]): void {
    this.isLoadingFilters = true;
    const requests: Observable<Region[]>[] = [];

    levels.forEach(level => {
      switch (level) {
        case 'distritoFederal':
          requests.push(this.apiService.getDistritosFederales(this.currentFilters.id_estado));
          break;
        case 'distritoLocal':
          requests.push(this.apiService.getDistritosLocales(this.currentFilters.id_distrito_federal));
          break;
        case 'municipio':
          requests.push(this.apiService.getMunicipios(this.currentFilters.id_distrito_local));
          break;
        case 'seccion':
          requests.push(this.apiService.getSecciones(this.currentFilters.id_municipio));
          break;
        case 'comunidad':
          requests.push(this.apiService.getComunidades(this.currentFilters.id_seccion));
          break;
      }
    });

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: (results) => {
          results.forEach((data, index) => {
            const level = levels[index];
            switch (level) {
              case 'distritoFederal': this.distritosFederales = data; break;
              case 'distritoLocal': this.distritosLocales = data; break;
              case 'municipio': this.municipios = data; break;
              case 'seccion': this.secciones = data; break;
              case 'comunidad': this.comunidades = data; break;
            }
          });
          this.isLoadingFilters = false;
        },
        error: () => this.isLoadingFilters = false
      });
    } else {
      this.isLoadingFilters = false;
    }
  }

  // ---------------------- PREGUNTAS DE ENCUESTA ----------------------
  loadSurveyQuestions(): void {
    this.isLoading = true;
    this.apiService.getSurveyQuestions().subscribe({
      next: (questions) => {
        this.surveyQuestions = questions;
        this.loadDynamicQuestionResults();
      },
      error: (err) => {
        console.error("Error al cargar preguntas", err);
        this.isLoading = false;
      }
    });
  }

  loadDynamicQuestionResults(): void {
    this.isLoadingQuestions = true;
    this.questionResults = {};

    const filters = this.prepareFilters();
    const resultRequests = this.surveyQuestions.map(question =>
      this.apiService.getQuestionResults(question.id_pregunta, filters)
    );

    if (resultRequests.length === 0) {
      this.isLoadingQuestions = false;
      this.isLoading = false;
      return;
    }

    forkJoin(resultRequests).subscribe({
      next: (results) => {
        results.forEach((result, index) => {
          this.questionResults[this.surveyQuestions[index].id_pregunta] = result;
        });
        this.isLoadingQuestions = false;
        this.isLoading = false;
        this.loadStaticDashboardData(filters);
      },
      error: (err) => {
        console.error("Error cargando resultados dinámicos", err);
        this.isLoadingQuestions = false;
        this.isLoading = false;
      }
    });
  }

  // ---------------------- KPIs / MAPA ----------------------
  loadStaticDashboardData(filters: DashboardFilters): void {
    forkJoin({
      kpis: this.apiService.getKpisGenerales(filters),
      ubicaciones: this.apiService.getUbicaciones(filters)
    }).subscribe({
      next: (result) => {
        this.kpisGenerales = result.kpis ?? null;
        this.ubicaciones = result.ubicaciones ?? [];
      },
      error: () => {
        this.kpisGenerales = null;
        this.ubicaciones = [];
      }
    });
  }

  // ---------------------- HELPERS ----------------------
  prepareFilters(): DashboardFilters {
    const filtersToSend = { ...this.currentFilters };
    Object.keys(filtersToSend).forEach(key => {
      if (filtersToSend[key] === 'all' || !filtersToSend[key]) {
        delete filtersToSend[key];
      }
    });
    return filtersToSend;
  }

  resetFilters(): void {
    this.currentFilters = {
      id_estado: 'all',
      id_distrito_federal: 'all',
      id_distrito_local: 'all',
      id_municipio: 'all',
      id_seccion: 'all',
      id_comunidad: 'all'
    };
    this.resetFiltersBelow('estado');
    this.loadSurveyQuestions();
  }

  private resetFiltersBelow(level: string): void {
    const levels = ['estado', 'distritoFederal', 'distritoLocal', 'municipio', 'seccion', 'comunidad'];
    const start = levels.indexOf(level) + 1;

    for (let i = start; i < levels.length; i++) {
      switch (levels[i]) {
        case 'distritoFederal': this.currentFilters.id_distrito_federal = 'all'; this.distritosFederales = []; break;
        case 'distritoLocal': this.currentFilters.id_distrito_local = 'all'; this.distritosLocales = []; break;
        case 'municipio': this.currentFilters.id_municipio = 'all'; this.municipios = []; break;
        case 'seccion': this.currentFilters.id_seccion = 'all'; this.secciones = []; break;
        case 'comunidad': this.currentFilters.id_comunidad = 'all'; this.comunidades = []; break;
      }
    }
  }
}
