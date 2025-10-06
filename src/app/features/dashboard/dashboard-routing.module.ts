import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { DashboardRegisterClientComponent } from './pages/dashboard-register-client/dashboard-register-client.component';

const routes: Routes = [
  {
    // muestra el componente DashboardPageComponent.
    path: '',
    component: DashboardPageComponent
  },
  {
    path: 'register',
    component: DashboardRegisterClientComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
