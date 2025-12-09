import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  menuItems = [
    { label: 'Inicio', path: '/dashboard', icon: 'fa-home' },
    { label: 'Registrar', path: '/dashboard/register', icon: 'fa-user-plus' },
    // Reportes link removed as requested
  ];
}
