import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../core/services/api.service';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../../shared/components/heatmap-map/heatmap-map.component';
import { DashboardFilters, KpisGenerales, GraficosDemograficos, Preferencia, Region, Ubicacion } from '../../../../shared/models/dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiCardComponent, HeatmapMapComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit {
  currentFilters: DashboardFilters = {};

  distritosFederales: Region[] = [];
  distritosLocales: Region[] = [];
  municipios: Region[] = [];

  kpisGenerales: KpisGenerales | null = null;
  graficosDemograficos: GraficosDemograficos | null = null;
  preferencias: Preferencia[] | null = null;
  ubicaciones: Ubicacion[] = [];

  isLoading: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadDashboardData();
  }

  loadFilterOptions(): void {
    // Al inicio, solo cargamos los filtros de nivel superior
    this.apiService.getDistritosFederales().subscribe(data => this.distritosFederales = data);
    this.apiService.getDistritosLocales().subscribe(data => this.distritosLocales = data);
    this.apiService.getMunicipios().subscribe(data => this.municipios = data);
  }

  onFederalDistrictChange(): void {
    // Reseteamos los filtros hijos
    this.currentFilters.id_distrito_local = 'all';
    this.currentFilters.id_municipio = 'all';

    // Recargamos las opciones del filtro hijo
    this.apiService.getDistritosLocales(this.currentFilters.id_distrito_federal).subscribe(data => {
      this.distritosLocales = data;
    });

    // Vaciamos las opciones del nieto
    this.municipios = [];

    // Recargamos los datos del dashboard
    this.loadDashboardData();
  }

  onLocalDistrictChange(): void {
    // Reseteamos el filtro hijo
    this.currentFilters.id_municipio = 'all';

    // Recargamos las opciones del filtro hijo
    this.apiService.getMunicipios(this.currentFilters.id_distrito_local).subscribe(data => {
      this.municipios = data;
    });

    // Recargamos los datos del dashboard
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    const filtersToSend: DashboardFilters = { ...this.currentFilters };
    for (const key in filtersToSend) {
      if (filtersToSend[key] === 'all' || !filtersToSend[key]) {
        delete filtersToSend[key];
      }
    }

    Promise.all([
      this.apiService.getKpisGenerales(filtersToSend).toPromise(),
      this.apiService.getGraficosDemograficos(filtersToSend).toPromise(),
      this.apiService.getPreferencias(filtersToSend).toPromise(),
      this.apiService.getUbicaciones(filtersToSend).toPromise()
    ]).then(([kpis, demograficos, preferencias, ubicaciones]) => {
      this.kpisGenerales = kpis ?? null;
      this.graficosDemograficos = demograficos ?? null;
      this.preferencias = preferencias ?? null;
      this.ubicaciones = ubicaciones ?? [];
    }).catch(error => {
      console.error('Error al cargar datos del dashboard', error);
    }).finally(() => {
      this.isLoading = false;
    });
  }

  resetFilters(): void {
    this.currentFilters = {};
    this.loadFilterOptions(); // Recargamos todas las opciones originales
    this.loadDashboardData();
  }
}
