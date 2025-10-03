import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http'; // Importa el proveedor de HttpClient
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { CoreModule } from './core/core.module'; // Aún podemos usar NgModules

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // 1. Provee las rutas de la aplicación
    provideHttpClient(),   // 2. Provee el servicio HttpClient para toda la app
    importProvidersFrom(CoreModule) // 3. Importa los providers del CoreModule (ej. ApiService)
  ]
};


