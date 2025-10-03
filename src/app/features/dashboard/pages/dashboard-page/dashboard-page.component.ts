// src/app/features/dashboard/pages/dashboard-page/component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import {
  DashboardFilters,
  KpisGenerales,
  GraficosDemograficos,
  Preferencia,
  Region,
} from '../../../../shared/models/dashboard.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  currentFilters: DashboardFilters = {};

  distritosFederales: Region[] = [];
  distritosLocales: Region[] = [];
  municipios: Region[] = [];

  kpisGenerales: KpisGenerales | null = null;
  graficosDemograficos: GraficosDemograficos | null = null;

  // ----- 👇 CORRECCIÓN 1: Añadir '[]' para que sea un array -----
  preferencias: Preferencia[] | null = null;

  isLoading: boolean = false;
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

  loadFilterOptions(): void {
    // Este método está bien, no necesita cambios
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

  loadDashboardData(): void {
    this.isLoading = true;
    Promise.all([
      this.apiService.getKpisGenerales(this.currentFilters).toPromise(),
      this.apiService.getGraficosDemograficos(this.currentFilters).toPromise(),
      this.apiService.getPreferencias(this.currentFilters).toPromise(),
    ])
      .then(([kpis, demograficos, preferencias]) => {
        this.kpisGenerales = kpis ?? null;
        this.graficosDemograficos = demograficos ?? null;

        // ----- 👇 CORRECCIÓN 2: Asignar correctamente el valor de la API -----
        this.preferencias = preferencias ?? null;
      })
      .catch((error) => {
        console.error('Error al cargar datos del dashboard', error);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  resetFilters(): void {
    this.currentFilters = {};
    this.loadDashboardData();
  }
}
