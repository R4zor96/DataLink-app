// src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import {
  DashboardFilters,
  KpisGenerales,
  GraficosDemograficos,
  Preferencia,
  Region,
  Ubicacion,
} from '../../../../shared/models/dashboard.models';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../../shared/components/heatmap-map/heatmap-map.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule, // Para *ngIf, *ngFor
    FormsModule, // Para [(ngModel)]
    KpiCardComponent,
    HeatmapMapComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  // Propiedad para almacenar los filtros seleccionados en la UI
  currentFilters: DashboardFilters = {};

  // Propiedades para poblar los menús desplegables
  distritosFederales: Region[] = [];
  distritosLocales: Region[] = [];
  municipios: Region[] = [];

  // Propiedades para almacenar los datos de la API
  kpisGenerales: KpisGenerales | null = null;
  graficosDemograficos: GraficosDemograficos | null = null;
  preferencias: Preferencia[] | null = null;
  ubicaciones: Ubicacion[] | null = null;

  // Estado de carga
  isLoading: boolean = false;

  // Subject para gestionar la desuscripción de observables y evitar fugas de memoria
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // Carga las listas de opciones para los menús desplegables de filtros
  loadFilterOptions(): void {
    this.apiService
      .getDistritosFederales()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        this.distritosFederales = data;
      });
    this.apiService
      .getDistritosLocales()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        this.distritosLocales = data;
      });
    this.apiService
      .getMunicipios()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((data) => {
        this.municipios = data;
      });
  }

  // Carga todos los datos del dashboard desde la API
  // En tu archivo dashboard-page.component.ts

  loadDashboardData(): void {
    this.isLoading = true;

    const filtersToSend: DashboardFilters = { ...this.currentFilters };

    for (const key in filtersToSend) {
      if (
        filtersToSend[key] === 'all' ||
        filtersToSend[key] === null ||
        filtersToSend[key] === undefined
      ) {
        delete filtersToSend[key];
      }
    }

    Promise.all([
      this.apiService.getKpisGenerales(filtersToSend).toPromise(),
      this.apiService.getGraficosDemograficos(filtersToSend).toPromise(),
      this.apiService.getPreferencias(filtersToSend).toPromise(),
      this.apiService.getUbicaciones(filtersToSend).toPromise(),
    ])
      .then(([kpis, demograficos, preferencias, ubicaciones]) => {
        this.kpisGenerales = kpis ?? null;
        this.graficosDemograficos = demograficos ?? null;
        this.preferencias = preferencias ?? null;
        this.ubicaciones = ubicaciones ?? null;
      })
      .catch((error) => {
        console.error('Error al cargar datos del dashboard', error);
        this.kpisGenerales = null;
        this.graficosDemograficos = null;
        this.preferencias = null;
        this.ubicaciones = null; // También resetea esto en caso de error
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  // Resetea todos los filtros y vuelve a cargar los datos
  resetFilters(): void {
    this.currentFilters = {};
    this.loadDashboardData();
  }
}
