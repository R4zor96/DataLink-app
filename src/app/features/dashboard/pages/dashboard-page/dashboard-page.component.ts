import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError } from 'rxjs/operators';
// Importa el ApiService
import { ApiService } from '../../../../core/services/api.service';
// Importa TODOS los componentes
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../../shared/components/heatmap-map/heatmap-map.component';
import { PieChartComponent } from '../../../../shared/components/pie-chart/pie-chart.component';
import { BarChartComponent } from '../../../../shared/components/bar-chart/bar-chart.component';
import { VerticalBarChartComponent } from '../../../../shared/components/vertical-bar-chart/vertical-bar-chart.component';
import { FilterSidebarComponent } from '../../../../shared/components/filter-sidebar/filter-sidebar.component';
// Importa TODOS los modelos e interfaces
import {
  DashboardFilters,
  KpisGenerales,
  Region,
  Ubicacion,
  QuestionResultDto,
  SurveyQuestion, // <-- Ahora se importa desde models
  QuestionOption, // <-- Ahora se importa desde models
} from '../../../../shared/models/dashboard.models';
import { forkJoin, Observable, of } from 'rxjs';
import { GaugeChartComponent } from '../../../../shared/components/gauge-chart/gauge-chart.component';

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
    GaugeChartComponent,
    VerticalBarChartComponent,
    FilterSidebarComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css'],
})
export class DashboardPageComponent implements OnInit {
  // ---------------------- FILTROS ----------------------
  currentFilters: DashboardFilters = {
    id_estado: 'all',
    id_distrito_federal: 'all',
    id_distrito_local: 'all',
    id_municipio: 'all',
    id_seccion: 'all',
    id_comunidad: 'all',
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

  // ---------------------- ESTADO SIDEBAR ----------------------
  isFilterSidebarOpen = false;
  masterAnswerFilters: DashboardFilters['answerFilters'] = {};

  // ---------------------- ESTADOS DE CARGA ----------------------
  isLoading: boolean = false;
  isLoadingFilters: boolean = false;
  isLoadingQuestions: boolean = false;

  constructor(private apiService: ApiService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ---------------------- LÓGICA DE CARGA ----------------------

  loadInitialData(): void {
    this.isLoading = true;
    this.isLoadingFilters = true;
    forkJoin({
      estados: this.apiService.getEstados(),
      questions: this.apiService.getSurveyQuestions(),
    }).subscribe({
      next: (results) => {
        this.surveyQuestions = results.questions;
        this.estados = results.estados;

        if (this.estados.length === 1) {
          this.currentFilters.id_estado = this.estados[0].id;
          this.loadFilterOptions(['distritoFederal']);
        } else {
          this.isLoadingFilters = false;
        }

        // Carga todos los datos AHORA que tenemos las preguntas
        this.loadAllDashboardData();
      },
      error: (err) => {
        console.error('Error al cargar datos iniciales', err);
        this.isLoading = false;
        this.isLoadingFilters = false;
      },
    });
  }

  loadAllDashboardData(): void {
    this.isLoading = true;
    this.isLoadingQuestions = true;
    this.questionResults = {}; // Limpia resultados anteriores

    const filters = this.prepareFilters();

    const staticData$ = forkJoin({
      kpis: this.apiService
        .getKpisGenerales(filters)
        .pipe(catchError(() => of(null))), // Evita que un error en kpis rompa todo
      ubicaciones: this.apiService
        .getUbicaciones(filters)
        .pipe(catchError(() => of([]))), // Evita que un error en ubicaciones rompa todo
    });

    const resultRequests$ =
      this.surveyQuestions.length > 0
        ? forkJoin(
            this.surveyQuestions.map(
              (q) =>
                this.apiService
                  .getQuestionResults(q.id_pregunta, filters)
                  .pipe(catchError(() => of([]))) // Evita que un error en una pregunta rompa todo
            )
          )
        : of([]);

    forkJoin({ static: staticData$, dynamic: resultRequests$ }).subscribe({
      next: (results) => {
        this.kpisGenerales = results.static.kpis ?? null;
        this.ubicaciones = results.static.ubicaciones ?? [];

        if (Array.isArray(results.dynamic)) {
          results.dynamic.forEach((result, index) => {
            if (this.surveyQuestions[index]) {
              this.questionResults[this.surveyQuestions[index].id_pregunta] =
                result;
            }
          });
        }

        this.isLoading = false;
        this.isLoadingQuestions = false;
      },
      error: (err) => {
        console.error('Error general del dashboard', err);
        this.isLoading = false;
        this.isLoadingQuestions = false;
        this.kpisGenerales = null;
        this.ubicaciones = [];
        this.questionResults = {};
      },
    });
  }

  // ---------------------- EVENTOS DE CASCADA ----------------------
  onEstadoChange(): void {
    this.resetFiltersBelow('estado');
    this.loadFilterOptions(['distritoFederal']);
    this.loadAllDashboardData();
  }
  onFederalDistrictChange(): void {
    this.resetFiltersBelow('distritoFederal');
    this.loadFilterOptions(['distritoLocal']);
    this.loadAllDashboardData();
  }
  onLocalDistrictChange(): void {
    this.resetFiltersBelow('distritoLocal');
    this.loadFilterOptions(['municipio']);
    this.loadAllDashboardData();
  }
  onMunicipioChange(): void {
    this.resetFiltersBelow('municipio');
    this.loadFilterOptions(['seccion']);
    this.loadAllDashboardData();
  }
  onSeccionChange(): void {
    this.resetFiltersBelow('seccion');
    this.loadFilterOptions(['comunidad']);
    this.loadAllDashboardData();
  }
  onComunidadChange(): void {
    this.loadAllDashboardData();
  }

  // ---------------------- CARGA FILTROS DINÁMICOS ----------------------
  loadFilterOptions(levels: string[]): void {
    this.isLoadingFilters = true;
    const requests: Observable<Region[]>[] = [];

    levels.forEach((level) => {
      switch (level) {
        case 'distritoFederal':
          requests.push(
            this.apiService.getDistritosFederales(this.currentFilters.id_estado)
          );
          break;
        case 'distritoLocal':
          requests.push(
            this.apiService.getDistritosLocales(
              this.currentFilters.id_distrito_federal
            )
          );
          break;
        case 'municipio':
          requests.push(
            this.apiService.getMunicipios(this.currentFilters.id_distrito_local)
          );
          break;
        case 'seccion':
          requests.push(
            this.apiService.getSecciones(this.currentFilters.id_municipio)
          );
          break;
        case 'comunidad':
          requests.push(
            this.apiService.getComunidades(this.currentFilters.id_seccion)
          );
          break;
      }
    });

    if (requests.length > 0) {
      forkJoin(requests).subscribe({
        next: (results) => {
          results.forEach((data, index) => {
            const level = levels[index];
            switch (level) {
              case 'distritoFederal':
                this.distritosFederales = data;
                break;
              case 'distritoLocal':
                this.distritosLocales = data;
                break;
              case 'municipio':
                this.municipios = data;
                break;
              case 'seccion':
                this.secciones = data;
                break;
              case 'comunidad':
                this.comunidades = data;
                break;
            }
          });
          this.isLoadingFilters = false;
        },
        error: () => (this.isLoadingFilters = false),
      });
    } else {
      this.isLoadingFilters = false;
    }
  }

  // ---------------------- HELPERS Y MANEJO DEL SIDEBAR ----------------------

  /**
   * Prepara el objeto de filtros para enviar a la API,
   * limpiando valores 'all' y añadiendo filtros de respuesta.
   */
  prepareFilters(): DashboardFilters {
    // Clona los filtros geográficos
    const filtersToSend: DashboardFilters = {};

    // Define un TIPO específico solo para las claves geográficas
    type GeoFilterKey =
      | 'id_estado'
      | 'id_distrito_federal'
      | 'id_distrito_local'
      | 'id_municipio'
      | 'id_seccion'
      | 'id_comunidad';

    // Define un ARRAY con esas claves
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
      const value = this.currentFilters[key]; // TypeScript sabe que 'value' es string | undefined
      if (value && value !== 'all') {
        filtersToSend[key] = value; // Asignación segura
      }
    });

    // Añade los filtros de respuesta si existen
    if (
      this.masterAnswerFilters &&
      Object.keys(this.masterAnswerFilters).length > 0
    ) {
      filtersToSend.answerFilters = this.masterAnswerFilters;
    }

    return filtersToSend;
  }

  resetFilters(): void {
    this.currentFilters = {
      id_estado: this.estados.length === 1 ? this.estados[0].id : 'all',
      id_distrito_federal: 'all',
      id_distrito_local: 'all',
      id_municipio: 'all',
      id_seccion: 'all',
      id_comunidad: 'all',
    };
    this.masterAnswerFilters = {};
    this.resetFiltersBelow('estado');

    if (this.currentFilters.id_estado !== 'all') {
      this.loadFilterOptions(['distritoFederal']);
    } else {
      this.distritosFederales = []; // Limpia si el estado es 'Todos'
    }

    this.loadAllDashboardData();
  }

  private resetFiltersBelow(level: string): void {
    const levels = [
      'estado',
      'distritoFederal',
      'distritoLocal',
      'municipio',
      'seccion',
      'comunidad',
    ];
    const start = levels.indexOf(level) + 1;

    for (let i = start; i < levels.length; i++) {
      switch (levels[i]) {
        case 'distritoFederal':
          this.currentFilters.id_distrito_federal = 'all';
          this.distritosFederales = [];
          break;
        case 'distritoLocal':
          this.currentFilters.id_distrito_local = 'all';
          this.distritosLocales = [];
          break;
        case 'municipio':
          this.currentFilters.id_municipio = 'all';
          this.municipios = [];
          break;
        case 'seccion':
          this.currentFilters.id_seccion = 'all';
          this.secciones = [];
          break;
        case 'comunidad':
          this.currentFilters.id_comunidad = 'all';
          this.comunidades = [];
          break;
      }
    }
  }

  // --- Métodos para el Sidebar de Filtros ---
  openFilterSidebar() {
    this.isFilterSidebarOpen = true;
  }

  closeFilterSidebar() {
    this.isFilterSidebarOpen = false;
  }

  onAnswerFiltersApplied(filters: DashboardFilters['answerFilters']) {
    this.masterAnswerFilters = filters || {};
    this.loadAllDashboardData();
    this.closeFilterSidebar();
  }

  // Navega al generador de reportes (ruta hija 'reports')
  goToReports() {
    // Navegación relativa para que funcione tanto en /dashboard como si el módulo está en otra ruta
    this.router.navigate(['reports'], { relativeTo: this.route });
  }
}
