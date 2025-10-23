import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

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
  templateUrl: './bar-chart.component.html', // Usaremos un canvas en lugar de divs
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title: string = 'Gráfico de Barras';
  @Input() description: string = 'Comparativa';
  @Input() data: ChartDataItem[] = [];

  // Usaremos un canvas para Chart.js
  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;
  defaultColors = ['#E71D36', '#FF9F1C', '#FFBF69', '#CBF3F0', '#2EC4B6', '#1B263B', '#0D1B2A'];

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
          borderRadius: 4, // Bordes redondeados
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Hace las barras horizontales si hay muchas etiquetas
        scales: {
          x: { // Eje X (valores)
             beginAtZero: true,
             grid: { display: false },
             ticks: { font: { size: 10 } }
          },
          y: { // Eje Y (etiquetas)
             grid: { display: false },
             ticks: { font: { size: 10 } }
          }
        },
        plugins: {
          legend: { display: false }, // Sin leyenda general
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed.x || context.parsed.y || 0}` // Muestra valor
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
