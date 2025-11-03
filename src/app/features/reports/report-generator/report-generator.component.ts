import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';
import { DEFAULT_CHART_COLORS } from '../../../shared/constants/chart-colors';

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

  // Gráficos disponibles (seleccionables)
  graficos: { id: string; nombre: string; seleccionado: boolean }[] = [
    { id: 'gauge', nombre: 'Gráfico semicircular (Gauge)', seleccionado: false },
    { id: 'hbar', nombre: 'Gráfico de barras horizontales', seleccionado: false },
    { id: 'vbar', nombre: 'Gráfico de barras verticales', seleccionado: false },
    { id: 'pie', nombre: 'Gráfico de pastel / dona', seleccionado: false }
  ];

  // ID del tipo de gráfico seleccionado por el usuario (selección única)
  selectedGraficoId: string | null = null;

  // Resultados de ejemplo para asegurar bindings
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

  // Datos simulados adicionales
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
  // Props used to render temporary charts for PDF capture
  renderChartsForPdf: boolean = false;
  pdfQuestions: SurveyQuestion[] = [];
  pdfQuestionResultsById: { [id: number]: QuestionResultDto[] } = {};
  // Flag to prevent concurrent PDF generation and to drive UI state
  isGeneratingPdf: boolean = false;
  get distritosLocalesCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.distritosLocales ?? 'N/A';
  }

  get municipiosCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.municipios ?? 'N/A';
  }

  constructor(private apiService: ApiService) {}

  // Decide which chart type to use for a question based on result shape
  public getChartTypeForQuestion(idPregunta: number): 'gauge' | 'pie' | 'vbar' | 'hbar' {
    // If the user selected a global chart type, force it for all questions
    if (this.selectedGraficoId) {
      return this.selectedGraficoId as 'gauge' | 'pie' | 'vbar' | 'hbar';
    }
    const data = this.pdfQuestionResultsById[idPregunta] || [];
    if (data.length === 2) return 'gauge';
    if (data.length <= 4) return 'pie';
    if (data.length <= 8) return 'vbar';
    return 'hbar';
  }

  // Map QuestionResultDto[] to the chart components data shape
  public mapToChartData(idPregunta: number) {
    const data: QuestionResultDto[] = this.pdfQuestionResultsById[idPregunta] || [];
    return data.map((d: QuestionResultDto, i: number) => ({ label: d.label, value: d.value, color: undefined }));
  }

  // Create an offscreen chart image (returns dataURL and canvas size)
  private async createChartImage(idPregunta: number, results: QuestionResultDto[]): Promise<{ imgData: string; width: number; height: number }> {
    // create hidden container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-20000px';
    container.style.top = '0px';
    container.style.width = '720px';
    container.style.height = '320px';
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    canvas.width = 1440; // retina scale x2
    canvas.height = 640;
    canvas.style.width = '720px';
    canvas.style.height = '320px';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      document.body.removeChild(container);
      throw new Error('No canvas context');
    }

    // Choose chart type
    const chartType = this.getChartTypeForQuestion(idPregunta);
    const labels = results.map(r => r.label);
    const values = results.map(r => r.value);

    // Use the app's default chart palette for consistent branding
    const colors = values.map((v, i) => DEFAULT_CHART_COLORS[i % DEFAULT_CHART_COLORS.length]);

    // Build Chart.js config
    const config: any = {
      type: chartType === 'gauge' ? 'doughnut' : (chartType === 'vbar' ? 'bar' : (chartType === 'hbar' ? 'bar' : 'doughnut')),
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors }]
      },
      options: {
        responsive: false,
        animation: false,
        maintainAspectRatio: false,
      }
    };

    // Adjust options for specific chart types
    if (chartType === 'gauge') {
      config.options.cutout = '70%';
      config.options.rotation = -90;
      config.options.circumference = 180;
    }
    if (chartType === 'hbar') {
      config.options.indexAxis = 'y';
    }

    // instantiate chart
    const chartInstance = new Chart(ctx as any, config);

    // wait a frame for chart to draw
    await new Promise(resolve => setTimeout(resolve, 80));

    const imgData = canvas.toDataURL('image/png');
    const width = canvas.width;
    const height = canvas.height;

    // cleanup
    try { chartInstance.destroy(); } catch (e) {}
    if (container.parentNode) container.parentNode.removeChild(container);

    return { imgData, width, height };
  }

  ngOnInit(): void {
    console.log('ReportGeneratorComponent cargado ✅');
    this.loadSurveyQuestions();
    this.mergeSimulatedData();
  }

  // Helper para checar si un gráfico está seleccionado por id (usado en templates)
  isSelected(id: string): boolean {
    // If a single global selection is made, honor it. Otherwise fall back to the per-item flag.
    if (this.selectedGraficoId) return this.selectedGraficoId === id;
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

  // 🔹 Generar PDF: ahora incluye TODAS las preguntas de la encuesta
  async generatePDF() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  // Prevent re-entrancy while generating
  this.isGeneratingPdf = true;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; // mm
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    // Preparar filtros para las llamadas a question-results
    const filtersToSend: DashboardFilters = { ...this.currentFilters };
    if (this.masterAnswerFilters && Object.keys(this.masterAnswerFilters).length > 0) {
      (filtersToSend as any).answerFilters = this.masterAnswerFilters as any;
    }

    // Obtener todas las preguntas (si no están ya cargadas)
    const questions = (this.surveyQuestions && this.surveyQuestions.length > 0)
      ? this.surveyQuestions
      : await firstValueFrom(this.apiService.getSurveyQuestions());

    // Si no hay preguntas, avisar
    if (!questions || questions.length === 0) {
      doc.setFontSize(14);
      doc.text('No se encontraron preguntas de la encuesta.', pageWidth / 2, pageHeight / 2, { align: 'center' });
  doc.save('reporte_electoral.pdf');
  this.isGeneratingPdf = false;
      return;
    }

    // Pedir resultados para todas las preguntas en paralelo (cada llamada maneja filtros)
    const resultsArr = await Promise.all(
      questions.map(q => firstValueFrom(this.apiService.getQuestionResults(q.id_pregunta, filtersToSend)).catch(() => []))
    );

    // Mapear idPregunta -> resultados
    const questionResultsById: { [id: number]: QuestionResultDto[] } = {};
    questions.forEach((q, i) => questionResultsById[q.id_pregunta] = resultsArr[i] || []);

    // Prepare temporary render area so Angular can create charts for each question
    this.pdfQuestions = questions;
    this.pdfQuestionResultsById = questionResultsById;
    this.renderChartsForPdf = true;

    try {
      // Process questions in small batches to avoid rendering all charts at once
      const MAX_QUESTIONS = 200; // safety cap
      const batchSize = 6; // number of charts to render/capture per pass
      const total = Math.min(questions.length, MAX_QUESTIONS);

      for (let start = 0; start < total; start += batchSize) {
        const batch = questions.slice(start, Math.min(start + batchSize, total));
        this.pdfQuestions = batch;
        this.pdfQuestionResultsById = questionResultsById;
        this.renderChartsForPdf = true;

        // Allow Angular to render the small batch
        await new Promise(resolve => setTimeout(resolve, 350));

        for (let i = 0; i < batch.length; i++) {
          const question = batch[i];
          const pageIndex = start + i;
          if (pageIndex > 0) doc.addPage();

          // Header
          doc.setFontSize(16);
          doc.setFont(undefined as any, 'bold');
          const headerY = margin + 8;
          doc.text(question.texto_pregunta, pageWidth / 2, headerY, { align: 'center' });

          // Meta
          doc.setFontSize(11);
          doc.setFont(undefined as any, 'normal');
          let metaY = headerY + 8;
          if (this.kpisGenerales) {
            doc.text(`Total encuestas: ${this.kpisGenerales.totalEncuestas}`, margin, metaY);
            doc.text(`Municipios: ${this.municipiosCubiertos}`, margin + 90, metaY);
            metaY += 6;
          }
          const municipio = (this.currentFilters && (this.currentFilters as any).id_municipio) ? (this.currentFilters as any).id_municipio : 'Todos';
          const seccion = (this.currentFilters && (this.currentFilters as any).id_seccion) ? (this.currentFilters as any).id_seccion : 'Todas';
          doc.text(`Municipio: ${municipio}   Sección: ${seccion}`, margin, metaY);

          // Use Chart.js to render an offscreen canvas for the question's data
          const resultsForQuestion = questionResultsById[question.id_pregunta] || [];
          if (resultsForQuestion && resultsForQuestion.length > 0) {
            try {
              const { imgData, width: cW, height: cH } = await this.createChartImage(question.id_pregunta, resultsForQuestion);
              const imgRatio = cW / cH;
              const reservedHeight = (metaY - margin) + 12;
              const availableHeight = contentHeight - reservedHeight;
              let imgHeight = availableHeight;
              let imgWidth = imgHeight * imgRatio;
              if (imgWidth > contentWidth) { imgWidth = contentWidth; imgHeight = imgWidth / imgRatio; }
              const imgX = (pageWidth - imgWidth) / 2;
              const imgY = metaY + 6;
              doc.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
            } catch (e) {
              // fallback to table below
              console.warn('Chart render failed for question', question.id_pregunta, e);
            }
          }

          // If no results or chart failed, render table
          if (!resultsForQuestion || resultsForQuestion.length === 0) {
            doc.setFontSize(11);
            let y = metaY + 12;
            doc.text('No hay resultados disponibles para esta pregunta.', margin, y);
          } else if (resultsForQuestion && resultsForQuestion.length > 0) {
            // nothing: already rendered chart
          }

          // Footer
          const footerText = `Página ${pageIndex + 1} de ${total}`;
          doc.setFontSize(10);
          doc.text(footerText, pageWidth / 2, pageHeight - margin + 6, { align: 'center' });
        }

        // Clear batch rendering before next batch
        this.renderChartsForPdf = false;
        // Small pause to allow GC/render cleanup
        await new Promise(resolve => setTimeout(resolve, 120));
      }

      doc.save('reporte_electoral.pdf');
  this.isGeneratingPdf = false;
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Ensure temporary area is cleared on error
      this.renderChartsForPdf = false;
      // Still attempt to save partial doc if available
      try { doc.save('reporte_electoral_partial.pdf'); } catch (e) {}
      // Show a user-friendly message and do not rethrow to avoid app crash
      try { window.alert('Ocurrió un error al generar el reporte. Revisa la consola para más detalles.'); } catch (e) {}
  this.isGeneratingPdf = false;
      return;
    }
  }
}