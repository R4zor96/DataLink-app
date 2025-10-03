// src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../../../core/services/api.service';
import { KpiCardComponent } from '../../../../shared/components/kpi-card/kpi-card.component';
import {
  DashboardFilters,
  KpisGenerales,
  GraficosDemograficos,
  Preferencia,
  Region,
} from '../../../../shared/models/dashboard.models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule, // Para *ngIf, *ngFor
    FormsModule,  // Para [(ngModel)]
    KpiCardComponent,
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
  preferencias: Preferencia[] | null = null; // Correctamente tipado como un array o null

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
    this.apiService.getDistritosFederales().pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.distritosFederales = data;
    });
    this.apiService.getDistritosLocales().pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.distritosLocales = data;
    });
    this.apiService.getMunicipios().pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      this.municipios = data;
    });
  }

  // Carga todos los datos del dashboard desde la API
  loadDashboardData(): void {
    this.isLoading = true;

    // 1. Crea una copia limpia de los filtros para enviar a la API
    const filtersToSend: DashboardFilters = { ...this.currentFilters };

    // 2. Revisa si algún filtro tiene el valor 'all' y lo elimina
    for (const key in filtersToSend) {
      if (filtersToSend[key] === 'all' || filtersToSend[key] === null || filtersToSend[key] === undefined) {
        delete filtersToSend[key];
      }
    }

    // 3. Ejecuta todas las peticiones a la API en paralelo
    Promise.all([
      this.apiService.getKpisGenerales(filtersToSend).toPromise(),
      this.apiService.getGraficosDemograficos(filtersToSend).toPromise(),
      this.apiService.getPreferencias(filtersToSend).toPromise(),
    ])
      .then(([kpis, demograficos, preferencias]) => {
        // 4. Asigna los resultados a las propiedades del componente de forma segura
        this.kpisGenerales = kpis ?? null;
        this.graficosDemograficos = demograficos ?? null;
        this.preferencias = preferencias ?? null;
      })
      .catch((error) => {
        console.error('Error al cargar datos del dashboard', error);
        // Resetea los datos en caso de error para no mostrar información vieja
        this.kpisGenerales = null;
        this.graficosDemograficos = null;
        this.preferencias = null;
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
