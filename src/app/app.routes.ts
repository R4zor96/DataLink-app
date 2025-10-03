import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
// import { AuthGuard } from './core/guards/auth.guard'; // Lo usaremos en el futuro

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent, // Usamos el layout como componente padre de las rutas
    children: [
      {
        path: 'dashboard',
        // Carga perezosa del módulo del dashboard
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
        // canActivate: [AuthGuard] // Así protegeríamos la ruta
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  // { path: '**', component: NotFoundComponent } // Ruta para página 404
];
