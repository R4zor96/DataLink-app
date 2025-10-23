import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from '../../shared/shared.module';

// 👇 NO necesitas importar el componente standalone aquí
// import { ReportGeneratorComponent } from '../reports/report-generator/report-generator.component';

@NgModule({
  declarations: [], // <-- Deja vacío
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule
  ]
})
export class DashboardModule { }
