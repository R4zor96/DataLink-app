import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 🧩 Importamos los componentes reutilizables del dashboard
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { PieChartComponent } from '../../../shared/components/pie-chart/pie-chart.component';
import { BarChartComponent } from '../../../shared/components/bar-chart/bar-chart.component';
import { GaugeChartComponent } from '../../../shared/components/gauge-chart/gauge-chart.component';
import { VerticalBarChartComponent } from '../../../shared/components/vertical-bar-chart/vertical-bar-chart.component';
import { FilterSidebarComponent } from '../../../shared/components/filter-sidebar/filter-sidebar.component';
// Removed unused chart components imports (not used in this component's template)

// 🧠 Modelos que ya usa tu dashboard
import { KpisGenerales, Ubicacion, QuestionResultDto, DashboardFilters, SurveyQuestion } from '../../../shared/models/dashboard.models';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  KpiCardComponent,
  PieChartComponent,
  BarChartComponent,
  GaugeChartComponent,
  VerticalBarChartComponent,
  FilterSidebarComponent,
  ],
  templateUrl: './report-generator.component.html',
  styleUrl: './report-generator.component.css'
})
export class ReportGeneratorComponent implements OnInit {

  // 🔹 Data simulada (puedes conectar con API o servicio compartido)
  // Inicialización compatible con la interfaz `KpisGenerales` en `shared/models/dashboard.models.ts`
  kpisGenerales: KpisGenerales | null = {
    totalEncuestas: 37,
    cobertura: {
      municipios: 8,
      distritosLocales: 6,
    },
    participacionGenero: [
      { genero: 'Hombres', total: '22' },
      { genero: 'Mujeres', total: '15' }
    ]
  };

  // `Ubicacion` en los modelos usa `latitud` y `longitud` como strings
  ubicaciones: Ubicacion[] = [
    { latitud: '19.3', longitud: '-98.2' },
    { latitud: '19.4', longitud: '-98.3' },
  ];

  // 🔹 Resultados de gráficas (simulados)
    // 🔹 Resultados de gráficas (simulados)
    // Limitamos a los 4 tipos que solicitaste: Gauge (semicircular), Horizontal Bar,
    // Vertical Bar y Pie/Doughnut. Cada entrada tiene un id que se usa como contenedor
    // (chart-<id>) para la generación de PDF.
    graficos: { id: string, nombre: string, seleccionado: boolean }[] = [
      { id: 'gauge', nombre: 'Gráfico semicircular (Gauge)', seleccionado: false },
      { id: 'hbar', nombre: 'Gráfico de barras horizontales', seleccionado: false },
      { id: 'vbar', nombre: 'Gráfico de barras verticales', seleccionado: false },
      { id: 'pie', nombre: 'Gráfico de pastel / dona', seleccionado: false }
    ];

  // `QuestionResultDto` espera `{ label: string; value: number }`
  questionResults: { [key: string]: QuestionResultDto[] } = {
    demografia: [
      { label: '18-24', value: 11 },
      { label: '25-34', value: 6 },
      { label: '35-44', value: 4 },
    ],
    preferencias: [
      { label: 'Morena', value: 11 },
      { label: 'PAN', value: 10 },
      { label: 'MC', value: 6 },
      { label: 'PRD', value: 4 },
    ]
  };

  // Datos simulados adicionales para los 4 tipos de gráfico
  // 'sexo' -> usado por el Gauge
  // 'politicosHombres' -> ejemplo para barras horizontales
  // 'rangoEdad' -> ejemplo para barras verticales
  // (ya tenemos 'demografia' para el pie)
  
  // Merge defaults right away so bindings in template are safe
  private mergeSimulatedData() {
    const add: { [key: string]: QuestionResultDto[] } = {
      sexo: [
        { label: 'Hombre', value: 22 },
        { label: 'Mujer', value: 15 }
      ],
      politicosHombres: [
        { label: 'Carlos Luna', value: 7 },
        { label: 'Delfino Suarez', value: 6 },
        { label: 'Alfonso Sanchez', value: 4 }
      ],
      rangoEdad: [
        { label: '18-24', value: 11 },
        { label: '25-34', value: 6 },
        { label: '35-44', value: 4 },
        { label: '45-54', value: 2 }
      ]
    };

    for (const k of Object.keys(add)) {
      if (!this.questionResults[k]) {
        this.questionResults[k] = add[k];
      }
    }
  }

  // --- Filtros (compatibles con Dashboard) ---
  currentFilters: DashboardFilters = {};
  surveyQuestions: SurveyQuestion[] = [];
  isFilterSidebarOpen: boolean = false;
  masterAnswerFilters: DashboardFilters['answerFilters'] = {};

  // Getters para mantener la plantilla existente que usa propiedades planas
  // Devuelven string|number para encajar con el Input de `KpiCardComponent` (number | string)
  get municipiosCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.municipios ?? 'N/A';
  }

  get distritosLocalesCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.distritosLocales ?? 'N/A';
  }

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    console.log('ReportGeneratorComponent cargado ✅');
    this.loadSurveyQuestions();
    this.mergeSimulatedData();
  }

  // Helper para checar si un gráfico está seleccionado por id (usado en templates)
  isSelected(id: string): boolean {
    return !!this.graficos.find(g => g.id === id && g.seleccionado);
  }

  // Carga las preguntas para alimentar el sidebar de filtros
  loadSurveyQuestions(): void {
    this.apiService.getSurveyQuestions().subscribe({
      next: (questions) => {
        this.surveyQuestions = questions;
      },
      error: () => {
        this.surveyQuestions = [];
      }
    });
  }

  openFilterSidebar() {
    this.isFilterSidebarOpen = true;
  }

  closeFilterSidebar() {
    this.isFilterSidebarOpen = false;
  }

  // Se llama desde el FilterSidebarComponent cuando el usuario aplica filtros
  onAnswerFiltersApplied(filters: { [questionId: string]: string[] }) {
    this.masterAnswerFilters = filters || {};
    // Reconstruir objecto de filtros para la API
    const filtersToSend: DashboardFilters = { ...this.currentFilters };
    if (Object.keys(this.masterAnswerFilters).length > 0) {
      filtersToSend.answerFilters = this.masterAnswerFilters as any;
    }
    this.loadFilteredData(filtersToSend);
  }

  // Recarga KPIs y ubicaciones usando los filtros seleccionados
  loadFilteredData(filters?: DashboardFilters) {
    this.apiService.getKpisGenerales(filters).subscribe({
      next: (kpis) => (this.kpisGenerales = kpis),
      error: () => (this.kpisGenerales = null),
    });

    this.apiService.getUbicaciones(filters).subscribe({
      next: (u) => (this.ubicaciones = u || []),
      error: () => (this.ubicaciones = []),
    });
    // Nota: podríamos recargar questionResults dinámicamente aquí si conocemos los ids
  }

  // 🔹 Generar PDF con los gráficos seleccionados
  async generatePDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 10;

    doc.setFontSize(16);
    doc.text('Reporte Electoral', 10, y);
    y += 10;

    // 🔸 Añadimos resumen general
    if (this.kpisGenerales) {
      doc.setFontSize(12);
      doc.text(`Total de encuestas: ${this.kpisGenerales.totalEncuestas}`, 10, y);
      y += 6;
      doc.text(`Municipios cubiertos: ${this.municipiosCubiertos ?? 'N/A'}`, 10, y);
      y += 6;
      doc.text(`Distritos cubiertos: ${this.distritosLocalesCubiertos ?? 'N/A'}`, 10, y);
      y += 10;
    }

    // 🔸 Capturar gráficas seleccionadas
    for (const grafico of this.graficos) {
      if (grafico.seleccionado) {
        const elemento = document.getElementById(`chart-${grafico.id}`);
        if (elemento) {
          const canvas = await html2canvas(elemento);
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          doc.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
          y += imgHeight + 10;

          if (y > 270) {
            doc.addPage();
            y = 10;
          }
        }
      }
    }

    doc.save('reporte_electoral.pdf');
  }
}
