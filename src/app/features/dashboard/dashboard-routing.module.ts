import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { DashboardRegisterClientComponent } from './pages/dashboard-register-client/dashboard-register-client.component';

// 👇 Importa tu nuevo componente de reportes
import { ReportGeneratorComponent } from '../reports/report-generator/report-generator.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardPageComponent
  },
  {
    path: 'register',
    component: DashboardRegisterClientComponent
  },
  {
    // 👇 Nueva ruta para generar los reportes
    path: 'reports',
    component: ReportGeneratorComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
