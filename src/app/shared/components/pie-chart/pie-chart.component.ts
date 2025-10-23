import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto'; // Importa Chart.js
import { DEFAULT_CHART_COLORS } from '../../../shared/constants/chart-colors';

// Interfaz para los datos de entrada
interface ChartDataItem {
  label: string;
  value: number;
  color?: string; // Color opcional
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title: string = 'Gráfico Circular';
  @Input() description: string = 'Distribución';
  @Input() data: ChartDataItem[] = []; // Recibe los datos

  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  totalValue: number = 0;
  // Paleta de colores sin el blanco
  defaultColors = DEFAULT_CHART_COLORS;
  // Propiedad para animación (opcional)
  animatedValue: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart) {
      this.updateChart();
    }
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy(); // Destruye el gráfico al salir
  }

  createChart(): void {
    if (!this.pieCanvas) return;
    const ctx = this.pieCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruye gráfico anterior si existe
    this.chart?.destroy();

    const chartData = this.prepareChartData();

    this.chart = new Chart(ctx, {
      type: 'doughnut', // Tipo dona para poner valor central
      data: {
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.values,
            backgroundColor: chartData.colors,
            borderColor: '#ffffff', // Borde blanco entre segmentos
            borderWidth: 2,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%', // Tamaño del agujero central
        plugins: {
          legend: {
            display: false, // Ocultamos la leyenda por defecto, usamos la personalizada
          },
          tooltip: {
            callbacks: {
              // Formato del tooltip
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage =
                  this.totalValue > 0
                    ? ((value / this.totalValue) * 100).toFixed(1)
                    : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    this.animateTotalValue(); // Anima el valor central
  }

  updateChart(): void {
    if (!this.chart) return;
    const chartData = this.prepareChartData();
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets[0].data = chartData.values;
    this.chart.data.datasets[0].backgroundColor = chartData.colors;
    this.chart.update();
    this.animateTotalValue();
  }

  prepareChartData(): { labels: string[]; values: number[]; colors: string[] } {
    this.totalValue = this.data.reduce((sum, item) => sum + item.value, 0);
    const labels = this.data.map((item) => item.label);
    const values = this.data.map((item) => item.value);
    // Usa el operador módulo para ciclar a través de los colores si hay más datos que colores
    const colors = this.data.map((item, index) => item.color || this.defaultColors[index % this.defaultColors.length]);
    // Actualizamos los datos para la leyenda personalizada
    this.data.forEach((item, index) => (item.color = colors[index]));
    return { labels, values, colors };
  }

  animateTotalValue() {
    // Calcula el porcentaje total (siempre 100% en un pie chart) o un valor relevante
    const targetValue = 100; // O podrías mostrar el totalValue
    // 👇 Envuelve la actualización en setTimeout 👇
    setTimeout(() => {
      this.animatedValue = targetValue;
    }, 0);
  }
}
