import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // 👈 1. Importa RouterLink directamente

@Component({
  selector: 'app-dashboard-register-client',
  imports: [RouterLink], // 👈 2. Agrega RouterLink a los imports
  templateUrl: './dashboard-register-client.component.html',
  styleUrl: './dashboard-register-client.component.css'
})
export class DashboardRegisterClientComponent {

}
