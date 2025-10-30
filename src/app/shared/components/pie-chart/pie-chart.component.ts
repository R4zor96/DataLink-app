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

// Interfaz para los datos de entrada
interface ChartDataItem {
  label: string;
  value: number;
  color?: string;
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
  @Input() data: ChartDataItem[] = [];

  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  totalValue: number = 0;
  defaultColors = DEFAULT_CHART_COLORS;

  // --- Propiedades para el centro del gráfico (modificadas) ---
  animatedValue: string = '0'; // Ahora es string para el número
  animatedLabel: string = 'N/A'; // Para el texto (ej. "Primaria")

  // Propiedad para la leyenda
  legendData: ChartDataItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      if (this.data && this.data.length > 0) {
        if (this.chart) {
          this.updateChart();
        } else if (this.pieCanvas) {
          this.createChart();
        }
      } else {
        this.clearChart();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.data.length > 0 && !this.chart) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  createChart(): void {
    if (!this.pieCanvas?.nativeElement || this.data.length === 0) return;
    const ctx = this.pieCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart?.destroy();

    const chartData = this.prepareChartData();
    this.setDisplayValues(); // Llama a la función que calcula el centro

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
            hoverOffset: 15, // Mantenemos el hover pronunciado
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
            callbacks: {
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
  }

  updateChart(): void {
    if (!this.chart || this.data.length === 0) {
      this.clearChart();
      return;
    }
    const chartData = this.prepareChartData();
    this.setDisplayValues(); // Vuelve a calcular el centro
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets[0].data = chartData.values;
    this.chart.data.datasets[0].backgroundColor = chartData.colors;
    this.chart.update();
  }

  clearChart(): void {
    this.chart?.destroy();
    this.chart = null;
    this.legendData = [];
    setTimeout(() => {
      this.animatedValue = '0';
      this.animatedLabel = 'N/A';
    }, 0);

    const ctx = this.pieCanvas?.nativeElement?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.pieCanvas.nativeElement.width, this.pieCanvas.nativeElement.height);
    }
  }

  prepareChartData(): { labels: string[]; values: number[]; colors: string[] } {
    if (!this.data || this.data.length === 0) {
      this.legendData = [];
      return { labels: [], values: [], colors: [] };
    }

    this.totalValue = this.data.reduce((sum, item) => sum + item.value, 0);
    const labels = this.data.map((item) => item.label);
    const values = this.data.map((item) => item.value);
    const colors = this.data.map((item, index) => item.color || this.defaultColors[index % this.defaultColors.length]);

    // Asigna los colores a 'legendData' para el HTML
    this.legendData = this.data.map((item, index) => ({
      ...item,
      color: colors[index]
    }));

    return { labels, values, colors };
  }

  // --- 👇 LÓGICA DEL CENTRO MODIFICADA 👇 ---
  setDisplayValues() {
    let newLabel = 'N/A';
    let newValue = '0';

    if (this.data && this.data.length > 0) {
      // 1. Encontrar el ítem con el valor más alto
      const maxItem = this.data.reduce(
        (max, item) => (item.value > max.value ? item : max),
        this.data[0]
      );

      // 2. Calcular su porcentaje
      const percentage = this.totalValue > 0
        ? ((maxItem.value / this.totalValue) * 100).toFixed(0)
        : 0;

      newLabel = maxItem.label;
      newValue = String(percentage);
    }

    // 3. Asignar con setTimeout para evitar error NG0100
    setTimeout(() => {
      this.animatedValue = newValue;
      this.animatedLabel = newLabel;
    }, 0);
  }
}
