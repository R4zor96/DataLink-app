import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
// 👇 1. Importa la constante de colores
import { DEFAULT_CHART_COLORS } from '../../../shared/constants/chart-colors';

// Interfaz para los datos de entrada
interface ChartDataItem {
  label: string;
  value: number;
  color?: string; // Color opcional
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bar-chart.component.html',
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title: string = 'Gráfico de Barras';
  @Input() description: string = 'Comparativa';
  @Input() data: ChartDataItem[] = [];

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;
  // 👇 2. Usa la constante importada
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
    if (!this.barCanvas) return;
    const ctx = this.barCanvas.nativeElement.getContext('2d');
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
        indexAxis: 'y', // Barras horizontales
        scales: {
          x: {
             beginAtZero: true,
             grid: { display: false },
             ticks: { font: { size: 10 } }
          },
          y: {
             grid: { display: false },
             ticks: { font: { size: 10 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed.x ?? context.parsed.y ?? 0}` // Muestra valor (ajustado para eje x o y)
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
    // La lógica aquí usa this.defaultColors correctamente
    const colors = this.data.map((item, index) => item.color || this.defaultColors[index % this.defaultColors.length]);
    return { labels, values, colors };
  }
}
