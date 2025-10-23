import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
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
  defaultColors = DEFAULT_CHART_COLORS;

  ngOnChanges(changes: SimpleChanges): void {
    // Si cambian los datos y el gráfico ya existe, actualízalo
    if (changes['data'] && this.chart) {
      this.updateChart();
    }
  }

  ngAfterViewInit(): void {
    // Crea el gráfico después de que la vista esté lista
    this.createChart();
  }

  ngOnDestroy(): void {
    // Destruye el gráfico al eliminar el componente para liberar memoria
    this.chart?.destroy();
  }

  createChart(): void {
    // Asegúrate de que el canvas exista
    if (!this.barCanvas?.nativeElement) return;
    const ctx = this.barCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destruye cualquier instancia previa del gráfico
    this.chart?.destroy();

    const chartData = this.prepareChartData();

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.values,
          backgroundColor: chartData.colors,
          borderRadius: 4, // Bordes redondeados sutiles
          borderSkipped: false, // Aplica borde redondeado a toda la barra
        }]
      },
      options: {
        responsive: true, // Hace que el gráfico se adapte al contenedor
        maintainAspectRatio: false, // Permite controlar la altura independientemente del ancho
        indexAxis: 'y', // Pone las etiquetas en el eje Y (barras horizontales)
        scales: {
          x: { // Eje X (valores numéricos)
            beginAtZero: true, // Asegura que el eje empiece en 0
            grid: {
              // color: 'rgba(0, 0, 0, 0.05)', // Color opcional para líneas verticales tenues
              display: true // Muestra las líneas verticales de la cuadrícula
            },
            ticks: {
              font: {
                size: 10 // Tamaño de fuente de los números del eje
              },
              color: '#9e9e9e' // Color gris para los números (secondary.DEFAULT)
            }
          },
          y: { // Eje Y (etiquetas de texto)
            grid: {
              display: false // Oculta las líneas horizontales de la cuadrícula
            },
            ticks: {
              font: {
                size: 10 // Tamaño de fuente de las etiquetas
              },
              color: '#616161' // Color gris oscuro para las etiquetas (secondary.dark)
            }
          }
        },
        plugins: {
          legend: {
            display: false // Oculta la leyenda superior (no necesaria para una sola serie)
          },
          tooltip: { // Configuración del cuadro de información al pasar el ratón
            callbacks: {
              // Define qué texto mostrar en el tooltip
              label: (context) => `${context.label}: ${context.parsed.x ?? context.parsed.y ?? 0}`
            }
          }
        }
      }
    });
  }

  updateChart(): void {
    // Actualiza los datos del gráfico si el componente recibe nueva información
    if (!this.chart) return;
    const chartData = this.prepareChartData();
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets[0].data = chartData.values;
    this.chart.data.datasets[0].backgroundColor = chartData.colors;
    this.chart.update(); // Redibuja el gráfico con los nuevos datos
  }

  prepareChartData(): { labels: string[], values: number[], colors: string[] } {
    // Prepara los datos del Input para que Chart.js los entienda
    const labels = this.data.map(item => item.label);
    const values = this.data.map(item => item.value);
    // Asigna colores de la paleta por defecto si no vienen definidos
    const colors = this.data.map((item, index) => item.color || this.defaultColors[index % this.defaultColors.length]);
    return { labels, values, colors };
  }
}
