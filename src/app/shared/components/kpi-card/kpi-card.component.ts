// src/app/shared/components/kpi-card/kpi-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- 1. Importa CommonModule

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule], // <-- 2. Añádelo aquí
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css'
})
export class KpiCardComponent {
  @Input() title: string = 'KPI Title';
  @Input() value: number | string = 'N/A';
  @Input() description: string = '';
  @Input() iconClass: string = 'fa fa-info-circle';
  @Input() bgColorClass: string = 'bg-blue-500';
}
