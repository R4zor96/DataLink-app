import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { DEFAULT_CHART_COLORS } from '../../../shared/constants/chart-colors';

// Interfaz para los datos (reutilizamos la misma)
interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-vertical-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vertical-bar-chart.component.html',
})
export class VerticalBarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title: string = 'Gráfico de Barras Vertical';
  @Input() description: string = 'Comparativa';
  @Input() data: ChartDataItem[] = [];

  @ViewChild('verticalBarCanvas') verticalBarCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;
  defaultColors = DEFAULT_CHART_COLORS;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart) {
      this.updateChart();
    }
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  createChart(): void {
    if (!this.verticalBarCanvas?.nativeElement) return;
    const ctx = this.verticalBarCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart?.destroy();

    const chartData = this.prepareChartData();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.values,
          backgroundColor: chartData.colors,
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // 👇 Cambiado a 'x' para barras verticales 👇
        indexAxis: 'x',
        scales: {
          x: { // Eje X (Etiquetas)
            grid: {
              display: false // Oculta líneas verticales
            },
            ticks: {
              font: { size: 10 },
              color: '#616161' // Gris oscuro
            }
          },
          y: { // Eje Y (Valores)
            beginAtZero: true,
            grid: {
              // color: 'rgba(0, 0, 0, 0.05)', // Líneas horizontales tenues (opcional)
              display: true // Muestra líneas horizontales
            },
            border: { display: false }, // Oculta línea principal del eje Y
            ticks: {
              font: { size: 10 },
              color: '#9e9e9e' // Gris medio
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed.y ?? 0}` // Muestra valor (ahora en eje Y)
            }
          }
        }
      }
    });
  }

  updateChart(): void {
    if (!this.chart) return;
    const chartData = this.prepareChartData();
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets[0].data = chartData.values;
    this.chart.data.datasets[0].backgroundColor = chartData.colors;
    this.chart.update();
  }

  prepareChartData(): { labels: string[], values: number[], colors: string[] } {
    const labels = this.data.map(item => item.label);
    const values = this.data.map(item => item.value);
    const colors = this.data.map((item, index) => item.color || this.defaultColors[index % this.defaultColors.length]);
    return { labels, values, colors };
  }
}
