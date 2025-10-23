import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../../shared/components/heatmap-map/heatmap-map.component';
import { DashboardFilters, KpisGenerales, GraficosDemograficos, Preferencia, Region, Ubicacion } from '../../../../shared/models/dashboard.models';
import { forkJoin, Observable, of } from 'rxjs'; // Importa forkJoin y of

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiCardComponent, HeatmapMapComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  // Inicializa todos los filtros en 'all'
  currentFilters: DashboardFilters = {
    id_estado: 'all',
    id_distrito_federal: 'all',
    id_distrito_local: 'all',
    id_municipio: 'all',
    id_seccion: 'all',
    id_comunidad: 'all'
  };

  // Listas para los desplegables
  estados: Region[] = [];
  distritosFederales: Region[] = [];
  distritosLocales: Region[] = [];
  municipios: Region[] = [];
  secciones: Region[] = [];
  comunidades: Region[] = [];

  // Datos del dashboard
  kpisGenerales: KpisGenerales | null = null;
  graficosDemograficos: GraficosDemograficos | null = null;
  preferencias: Preferencia[] | null = null;
  ubicaciones: Ubicacion[] = [];

  isLoading: boolean = false;
  isLoadingFilters: boolean = false; // Estado de carga específico para filtros

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadInitialFilterOptions(); // Carga solo el primer nivel al inicio
    this.loadDashboardData();
  }

  // Carga solo las opciones iniciales (Estados)
  loadInitialFilterOptions(): void {
    this.isLoadingFilters = true;
    this.apiService.getEstados().subscribe(data => {
      this.estados = data;
      // Si solo hay un estado (Tlaxcala), lo seleccionamos por defecto
      if (data.length === 1) {
        this.currentFilters.id_estado = data[0].id;
        this.onEstadoChange(); // Cargamos los filtros hijos
      } else {
        this.isLoadingFilters = false;
      }
    });
  }

  // --- Lógica de Cascada ---

  onEstadoChange(): void {
    this.resetFiltersBelow('estado');
    this.loadFilterOptions(['distritoFederal']);
    this.loadDashboardData();
  }

  onFederalDistrictChange(): void {
    this.resetFiltersBelow('distritoFederal');
    this.loadFilterOptions(['distritoLocal']);
    this.loadDashboardData();
  }

  onLocalDistrictChange(): void {
    this.resetFiltersBelow('distritoLocal');
    this.loadFilterOptions(['municipio']);
    this.loadDashboardData();
  }

  onMunicipioChange(): void {
    this.resetFiltersBelow('municipio');
    this.loadFilterOptions(['seccion']);
    this.loadDashboardData();
  }

  onSeccionChange(): void {
    this.resetFiltersBelow('seccion');
    this.loadFilterOptions(['comunidad']);
    this.loadDashboardData();
  }

  onComunidadChange(): void {
    // El último nivel solo recarga los datos
    this.loadDashboardData();
  }

  // --- Carga de Opciones de Filtro (Dinámica) ---
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
      forkJoin(requests).subscribe(results => {
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
      }, () => this.isLoadingFilters = false); // Manejo de error básico
    } else {
        this.isLoadingFilters = false;
    }
  }

  // --- Carga de Datos del Dashboard ---
  loadDashboardData(): void {
    this.isLoading = true;
    const filtersToSend: DashboardFilters = { ...this.currentFilters };
    for (const key in filtersToSend) {
      if (filtersToSend[key] === 'all' || !filtersToSend[key]) {
        delete filtersToSend[key];
      }
    }

    // Usamos forkJoin para lanzar todas las peticiones a la vez
    forkJoin({
        kpis: this.apiService.getKpisGenerales(filtersToSend),
        demograficos: this.apiService.getGraficosDemograficos(filtersToSend),
        preferencias: this.apiService.getPreferencias(filtersToSend),
        ubicaciones: this.apiService.getUbicaciones(filtersToSend)
    }).subscribe({
        next: (results) => {
            this.kpisGenerales = results.kpis ?? null;
            this.graficosDemograficos = results.demograficos ?? null;
            this.preferencias = results.preferencias ?? null;
            this.ubicaciones = results.ubicaciones ?? [];
            this.isLoading = false;
        },
        error: (error) => {
            console.error('Error al cargar datos del dashboard', error);
            // Considera resetear los datos aquí también
            this.kpisGenerales = null;
            this.graficosDemograficos = null;
            this.preferencias = null;
            this.ubicaciones = [];
            this.isLoading = false;
        }
    });
  }

  // --- Reseteo de Filtros ---
  resetFilters(): void {
    this.currentFilters = {
      id_estado: this.estados.length === 1 ? this.estados[0].id : 'all', // Mantiene el estado si solo hay uno
      id_distrito_federal: 'all',
      id_distrito_local: 'all',
      id_municipio: 'all',
      id_seccion: 'all',
      id_comunidad: 'all'
    };
    // Resetea las listas de opciones hijas
    this.distritosFederales = [];
    this.distritosLocales = [];
    this.municipios = [];
    this.secciones = [];
    this.comunidades = [];
    // Recarga las opciones dependientes del estado (si aplica)
    if (this.currentFilters.id_estado !== 'all') {
        this.onEstadoChange();
    } else {
        this.loadInitialFilterOptions(); // Carga solo el primer nivel
        this.loadDashboardData();
    }
  }

  // Helper para resetear filtros y listas por debajo del nivel cambiado
  private resetFiltersBelow(level: string): void {
    const levels = ['estado', 'distritoFederal', 'distritoLocal', 'municipio', 'seccion', 'comunidad'];
    const startIndex = levels.indexOf(level) + 1;

    for (let i = startIndex; i < levels.length; i++) {
        const currentLevel = levels[i];
        switch (currentLevel) {
            case 'distritoFederal': this.currentFilters.id_distrito_federal = 'all'; this.distritosFederales = []; break;
            case 'distritoLocal': this.currentFilters.id_distrito_local = 'all'; this.distritosLocales = []; break;
            case 'municipio': this.currentFilters.id_municipio = 'all'; this.municipios = []; break;
            case 'seccion': this.currentFilters.id_seccion = 'all'; this.secciones = []; break;
            case 'comunidad': this.currentFilters.id_comunidad = 'all'; this.comunidades = []; break;
        }
    }
  }
}
