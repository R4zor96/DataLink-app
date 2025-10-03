import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../../shared/shared.module'; // Importa SharedModule

@NgModule({
  declarations: [], // Vacío porque DashboardPageComponent es standalone
  imports: [
    CommonModule,
    DashboardRoutingModule, // Conecta el archivo de rutas
    SharedModule            // Permite usar los componentes compartidos
  ]
})
export class DashboardModule { }
