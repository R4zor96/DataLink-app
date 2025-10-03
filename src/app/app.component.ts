import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true, // Marcar como Standalone
  imports: [RouterOutlet], // Solo necesita el RouterOutlet
  template: `<router-outlet></router-outlet>`, // Su template solo contiene el router-outlet
})
export class AppComponent {
  title = 'DataLink-app';
}
