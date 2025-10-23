import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
// 👇 1. Importa la constante de colores
import { DEFAULT_CHART_COLORS } from '../../../shared/constants/chart-colors';

// Interfaz para los datos (reutilizamos la misma)
interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-gauge-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gauge-chart.component.html',
})
export class GaugeChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title: string = 'Gráfico Gauge';
  @Input() description: string = 'Proporción';
  @Input() data: ChartDataItem[] = []; // Espera exactamente 2 items

  @ViewChild('gaugeCanvas') gaugeCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  displayValue: string = 'N/A'; // Valor a mostrar en el centro

  // 👇 2. Usa la constante importada
  defaultColors = DEFAULT_CHART_COLORS;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart && this.data.length === 2) {
      this.updateChart();
    } else if (this.chart && (!changes['data'].currentValue || changes['data'].currentValue.length !== 2)) { // Verifica si los datos cambiaron a algo != 2
      // Si los datos no son 2, limpia el gráfico
      this.clearChart();
    } else if (!this.chart && changes['data']?.currentValue?.length === 2) {
       // Si no había gráfico pero ahora hay datos válidos, créalo
       this.createChart();
    }
  }

  ngAfterViewInit(): void {
    // Solo crea el gráfico si ya hay datos válidos al inicio
    if (this.data.length === 2) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  createChart(): void {
    if (!this.gaugeCanvas || this.data.length !== 2) return;
    const ctx = this.gaugeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart?.destroy();

    const chartData = this.prepareChartData();
    this.setDisplayValue();

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.values,
          backgroundColor: chartData.colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 8,
          circumference: 180,
          rotation: -90,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
             callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = this.data.reduce((sum, item) => sum + item.value, 0); // Recalcula el total aquí
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  updateChart(): void {
    if (!this.chart || this.data.length !== 2) {
       this.clearChart();
       return;
    };
    const chartData = this.prepareChartData();
    this.setDisplayValue();
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets[0].data = chartData.values;
    this.chart.data.datasets[0].backgroundColor = chartData.colors;
    this.chart.update();
  }

  clearChart(): void {
    this.chart?.destroy();
    this.chart = null;
    this.displayValue = 'N/A';
    const ctx = this.gaugeCanvas?.nativeElement?.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, this.gaugeCanvas.nativeElement.width, this.gaugeCanvas.nativeElement.height);
    }
  }


  prepareChartData(): { labels: string[], values: number[], colors: string[] } {
    if (this.data.length !== 2) return { labels: [], values: [], colors: [] };

    // Aseguramos colores distintos usando la paleta importada
    const colors = [
        this.data[0].color || this.defaultColors[0], // Usa el primer color de la paleta
        this.data[1].color || this.defaultColors[1]  // Usa el segundo color de la paleta
    ];
    // Asigna los colores a los datos para la leyenda
    if(this.data[0]) this.data[0].color = colors[0];
    if(this.data[1]) this.data[1].color = colors[1];

    return {
      labels: this.data.map(item => item.label),
      values: this.data.map(item => item.value),
      colors: colors
    };
  }

  setDisplayValue(): void {
      if (this.data.length === 2) {
          const total = this.data[0].value + this.data[1].value;
          this.displayValue = total > 0 ? ((this.data[0].value / total) * 100).toFixed(0) + '%' : '0%';
      } else {
          this.displayValue = 'N/A';
      }
  }
}
