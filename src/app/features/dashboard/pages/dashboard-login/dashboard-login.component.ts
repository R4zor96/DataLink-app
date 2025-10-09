import { Component } from '@angular/core';
import { DashboardRoutingModule } from "../../dashboard-routing.module";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-login',
  imports: [DashboardRoutingModule, RouterLink],
  templateUrl: './dashboard-login.component.html',
  styleUrl: './dashboard-login.component.css'
})
export class DashboardLoginComponent {

}
