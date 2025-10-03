// src/app/shared/shared.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Necesario para formularios y filtros

@NgModule({
  imports: [
    CommonModule,
    FormsModule,          // Para ngModel en filtros simples
    ReactiveFormsModule,  // Para formularios más complejos
    KpiCardComponent // Importa el standalone component
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    KpiCardComponent // Exporta el componente para que otros módulos puedan usarlo
  ]
})
export class SharedModule { }
