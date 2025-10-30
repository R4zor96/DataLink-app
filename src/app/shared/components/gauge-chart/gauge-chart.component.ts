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
import Chart from 'chart.js/auto';
import { DEFAULT_CHART_COLORS } from '../../../shared/constants/chart-colors';

// Interfaz para los datos
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
export class GaugeChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() title: string = 'Gráfico Gauge';
  @Input() description: string = 'Proporción';
  @Input() data: ChartDataItem[] = []; // Recibe los datos

  @ViewChild('gaugeCanvas') gaugeCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  displayValue: string = 'N/A'; // Valor a mostrar en el centro
  defaultColors = DEFAULT_CHART_COLORS;

  // 👇 Propiedad separada para la leyenda
  legendData: ChartDataItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      if (this.data && this.data.length === 2) {
        if (this.chart) {
          this.updateChart();
        } else if (this.gaugeCanvas) {
          this.createChart();
        }
      } else {
        this.clearChart();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.data.length === 2 && !this.chart) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  createChart(): void {
    if (!this.gaugeCanvas?.nativeElement || this.data.length !== 2) return;
    const ctx = this.gaugeCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart?.destroy();

    const chartData = this.prepareChartData(); // Esto poblará this.legendData
    this.setDisplayValue(); // Esto usa setTimeout

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.values,
            backgroundColor: chartData.colors,
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 8,
            circumference: 180,
            rotation: -90,
          },
        ],
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
                const total = this.data.reduce(
                  (sum, item) => sum + item.value,
                  0
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  updateChart(): void {
    if (!this.chart || this.data.length !== 2) {
      this.clearChart();
      return;
    }
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
    this.legendData = []; // Limpia la leyenda

    setTimeout(() => {
      this.displayValue = 'N/A';
    }, 0); // Evita error

    const ctx = this.gaugeCanvas?.nativeElement?.getContext('2d');
    if (ctx) {
      ctx.clearRect(
        0,
        0,
        this.gaugeCanvas.nativeElement.width,
        this.gaugeCanvas.nativeElement.height
      );
    }
  }

  prepareChartData(): { labels: string[]; values: number[]; colors: string[] } {
    if (this.data.length !== 2) {
      this.legendData = []; // Limpia la leyenda si los datos son inválidos
      return { labels: [], values: [], colors: [] };
    }

    const colors = [
      this.data[0].color || this.defaultColors[0],
      this.data[1].color || this.defaultColors[1],
    ];

    // 👇 CORRECCIÓN: Asigna a 'this.legendData' síncronamente
    // No usamos setTimeout aquí, ya que el 'ngFor' lo leerá en el mismo ciclo
    this.legendData = [
      {
        label: this.data[0].label,
        value: this.data[0].value,
        color: colors[0],
      },
      {
        label: this.data[1].label,
        value: this.data[1].value,
        color: colors[1],
      },
    ];

    // NO MODIFICAMOS 'this.data'
    // if (this.data[0]) this.data[0].color = colors[0]; // <- ESTO CAUSA EL ERROR
    // if (this.data[1]) this.data[1].color = colors[1]; // <- ESTO CAUSA EL ERROR

    return {
      labels: this.legendData.map((item) => item.label),
      values: this.legendData.map((item) => item.value),
      colors: colors,
    };
  }

  // Se mantiene el fix para displayValue
  setDisplayValue(): void {
    let newValue = 'N/A';
    if (this.data.length === 2) {
      const total = this.data[0].value + this.data[1].value;
      newValue =
        total > 0
          ? ((this.data[0].value / total) * 100).toFixed(0) + '%'
          : '0%';
    }

    setTimeout(() => {
      this.displayValue = newValue;
    }, 0);
  }
}
