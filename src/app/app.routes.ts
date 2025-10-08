import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { DashboardLoginComponent } from './features/dashboard/pages/dashboard-login/dashboard-login.component';
// import { AuthGuard } from './core/guards/auth.guard'; // Lo usaremos en el futuro

export const routes: Routes = [
  {
    path: '',
    component: DashboardLoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: MainLayoutComponent, // Usamos el layout como componente padre de las rutas
    children: [
      {
        path: '',
        // Carga perezosa del módulo del dashboard
        loadChildren: () =>
          import('./features/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
        // canActivate: [AuthGuard] // Así protegeríamos la ruta
      },
    ],
  },
  // { path: '**', component: NotFoundComponent } // Ruta para página 404
];
