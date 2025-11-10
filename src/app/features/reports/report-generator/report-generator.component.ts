import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { firstValueFrom } from 'rxjs';
import Chart from 'chart.js/auto';
import { ActivatedRoute } from '@angular/router';
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
  private readonly CAPTURE_SCALE = 3;
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
  // Higher scale for canvas captures (increase for sharper images; beware memory)
  // Eliminado: CAPTURE_SCALE ya está declarado más arriba
  // Optional PDF background (data URL) loaded from assets at runtime
  private pdfBackgroundDataUrl: string | null = null;
  // Prepared small logo data URL (PNG) to draw in the corner
  private smallLogoDataUrl: string | null = null;
  get distritosLocalesCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.distritosLocales ?? 'N/A';
  }

  get municipiosCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.municipios ?? 'N/A';
  }

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  // Convert pixels to millimeters taking into account the capture scale.
  // We assume a base screen DPI of 96 and multiply by the CAPTURE_SCALE used when rendering.
  private pxToMm(px: number): number {
    const dpi = 96 * this.CAPTURE_SCALE;
    return (px * 25.4) / dpi;
  }

  // Convert millimeters to pixels using the same effective DPI used for canvas rendering
  private mmToPx(mm: number): number {
    const dpi = 96 * this.CAPTURE_SCALE;
    return Math.max(1, Math.round((mm / 25.4) * dpi));
  }

  // Compose a full-page image by drawing the prepared page-sized background and overlaying the chart image
  // chartImgData: dataURL of the chart (PNG), chartPxW/H are its pixel dimensions
  // imgXmm/imgYmm/imgWidthMm/imgHeightMm determine where the chart should be placed on the page (in mm)
  private async composePageImageWithChart(chartImgData: string, chartPxW: number, chartPxH: number,
                                         pageWmm: number, pageHmm: number,
                                         imgXmm: number, imgYmm: number, imgWidthMm: number, imgHeightMm: number): Promise<string> {
    // page pixel dims
    const pxW = this.mmToPx(pageWmm);
    const pxH = this.mmToPx(pageHmm);

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pxW;
    pageCanvas.height = pxH;
    const ctx = pageCanvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context for page composition');

    // draw background (if prepared) - it should already be page-sized but draw to be safe
    if (this.pdfBackgroundDataUrl) {
      const bgImg = await this.imageElementFromDataUrl(this.pdfBackgroundDataUrl);
      ctx.drawImage(bgImg, 0, 0, pxW, pxH);
    } else {
      // clear white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pxW, pxH);
    }

    // draw chart image onto page canvas at the requested mm coordinates
    const chartImg = await this.imageElementFromDataUrl(chartImgData);
    const destX = this.mmToPx(imgXmm);
    const destY = this.mmToPx(imgYmm);
    const destW = this.mmToPx(imgWidthMm);
    const destH = this.mmToPx(imgHeightMm);
    ctx.drawImage(chartImg, 0, 0, chartPxW, chartPxH, destX, destY, destW, destH);

    // return composed PNG dataURL
    return pageCanvas.toDataURL('image/png');
  }

  // Compose only the chart region by cropping the prepared page background and drawing the chart on top.
  // Returns a dataURL for the cropped region which can be added to the PDF at the specified mm rect.
  private async composeChartRegionWithBackground(chartImgData: string, chartPxW: number, chartPxH: number,
                                                 pageWmm: number, pageHmm: number,
                                                 destXmm: number, destYmm: number, destWmm: number, destHmm: number): Promise<string> {
    // page pixels
    const pagePxW = this.mmToPx(pageWmm);
    const pagePxH = this.mmToPx(pageHmm);

    // destination (region) pixels
    const destPxX = this.mmToPx(destXmm);
    const destPxY = this.mmToPx(destYmm);
    const destPxW = this.mmToPx(destWmm);
    const destPxH = this.mmToPx(destHmm);

    // create a temp page-sized canvas and draw the prepared background into it
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = pagePxW;
    pageCanvas.height = pagePxH;
    const pCtx = pageCanvas.getContext('2d');
    if (!pCtx) throw new Error('No canvas context for page composition');

    if (this.pdfBackgroundDataUrl) {
      const bgImg = await this.imageElementFromDataUrl(this.pdfBackgroundDataUrl);
      pCtx.drawImage(bgImg, 0, 0, pagePxW, pagePxH);
    } else {
      pCtx.fillStyle = '#ffffff';
      pCtx.fillRect(0, 0, pagePxW, pagePxH);
    }

    // Now create a canvas for just the region we want to place into the PDF
    const regionCanvas = document.createElement('canvas');
    regionCanvas.width = destPxW;
    regionCanvas.height = destPxH;
    const rCtx = regionCanvas.getContext('2d');
    if (!rCtx) throw new Error('No canvas context for region composition');

    // copy the region of the page that will be under the chart
    rCtx.drawImage(pageCanvas, destPxX, destPxY, destPxW, destPxH, 0, 0, destPxW, destPxH);

    // draw the chart onto that region, scaling the chart pixels to the region size
    const chartImg = await this.imageElementFromDataUrl(chartImgData);
    rCtx.drawImage(chartImg, 0, 0, chartPxW, chartPxH, 0, 0, destPxW, destPxH);

    return regionCanvas.toDataURL('image/png');
  }

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
    // visual size in CSS pixels
    const visualWidth = 720;
    const visualHeight = 320;
    container.style.width = visualWidth + 'px';
    container.style.height = visualHeight + 'px';
    document.body.appendChild(container);

    const canvas = document.createElement('canvas');
    // render at higher pixel density for crisper images
    canvas.width = visualWidth * this.CAPTURE_SCALE;
    canvas.height = visualHeight * this.CAPTURE_SCALE;
    canvas.style.width = visualWidth + 'px';
    canvas.style.height = visualHeight + 'px';
  // ensure canvas background is transparent so PDF background can show through
  canvas.style.background = 'transparent';
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
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'end',
            formatter: (value: number, context: any) => {
              return `${value} personas`;
            },
            color: '#000',
            font: {
              weight: 'bold'
            }
          }
        }
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

    // export as PNG so transparency is preserved and the PDF background remains visible
    const imgData = canvas.toDataURL('image/png');

    const width = canvas.width; // pixels
    const height = canvas.height; // pixels

    // cleanup
    try { chartInstance.destroy(); } catch (e) {}
    if (container.parentNode) container.parentNode.removeChild(container);

    return { imgData, width, height };
  }

  ngOnInit(): void {
    console.log('ReportGeneratorComponent cargado ✅');

    // If dashboard forwarded geographic filters via query params (e.g. id_distrito_federal),
    // apply them now so all data and PDF generation honor the same scope.
    try {
      const params = this.route.snapshot && (this.route.snapshot.queryParams || {});
      const geoKeys = ['id_estado', 'id_distrito_federal', 'id_distrito_local', 'id_municipio', 'id_seccion', 'id_comunidad'];
      let applied = false;
      for (const k of geoKeys) {
        if (params && params[k] !== undefined && params[k] !== null && params[k] !== '') {
          (this.currentFilters as any)[k] = params[k];
          applied = true;
        }
      }
      if (applied) {
        console.log('[ReportGenerator] Applied filters from dashboard:', this.currentFilters);
        // Reload KPIs/Ubicaciones using the applied filters so the page matches the dashboard scope
        this.loadFilteredData(this.currentFilters);
      }
    } catch (e) {
      console.debug('[ReportGenerator] Could not read route query params', e);
    }

    this.loadSurveyQuestions();
    this.mergeSimulatedData();
  }

  // Load an image from the assets folder and store as dataURL for use as full-page background.
  // Place your background image at `src/assets/report-bg.png` (or change the path below).
  /**
   * Load the project's background image and render it into a canvas sized to the PDF page
   * so the image is contained (fully visible) and centered. This avoids cropping logos.
   * pageWmm/pageHmm are the page dimensions in millimeters (A4 landscape values passed from generatePDF).
   */
  private async loadPdfBackground(pageWmm: number, pageHmm: number, opacity = 0.12): Promise<void> {
    try {
      const url = '/assets/report-bg.png';
      const resp = await fetch(url);
      if (!resp.ok) {
        console.debug('[ReportGenerator] pdf background not found at', url, 'status', resp.status);
        this.pdfBackgroundDataUrl = null;
        return;
      }
      const blob = await resp.blob();
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = (err) => reject(err);
        fr.readAsDataURL(blob);
      });

      // Create an image element from the data URL
      const imgEl = await this.imageElementFromDataUrl(rawDataUrl);

      // compute pixel dimensions for the PDF page using an effective DPI
      const dpi = 96 * this.CAPTURE_SCALE; // same scale used for chart canvases
      const pxW = Math.max(1, Math.round((pageWmm / 25.4) * dpi));
      const pxH = Math.max(1, Math.round((pageHmm / 25.4) * dpi));

      const canvas = document.createElement('canvas');
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // fallback to raw dataURL
        this.pdfBackgroundDataUrl = rawDataUrl;
        return;
      }

      // clear with white (or transparent if you prefer)
      ctx.clearRect(0, 0, pxW, pxH);

      // compute COVER fit (scale image so it fully covers the page) and center it
      // This makes the background full-bleed and preserves visual composition.
      const imgRatio = imgEl.width / imgEl.height || 1;
      const pageRatio = pxW / pxH || 1;
      let drawW: number, drawH: number;
      if (imgRatio > pageRatio) {
        // image is relatively wider: match height and crop horizontally
        drawH = pxH;
        drawW = Math.round(pxH * imgRatio);
      } else {
        // image is relatively taller or equal: match width and crop vertically
        drawW = pxW;
        drawH = Math.round(pxW / imgRatio);
      }
      // center the image so important parts remain visible
      const offsetX = Math.round((pxW - drawW) / 2);
      const offsetY = Math.round((pxH - drawH) / 2);

      // draw faded background so logos/content stay readable
      ctx.globalAlpha = opacity;
      ctx.drawImage(imgEl, offsetX, offsetY, drawW, drawH);
      ctx.globalAlpha = 1;

      this.pdfBackgroundDataUrl = canvas.toDataURL('image/png');
      console.debug('[ReportGenerator] prepared pdf background (contained) size', pxW, 'x', pxH, 'draw', drawW, 'x', drawH, 'opacity', opacity);
    } catch (err) {
      console.debug('[ReportGenerator] could not load PDF background', err);
      this.pdfBackgroundDataUrl = null;
    }
  }

  // Create an HTMLImageElement from a data URL
  private async imageElementFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
  }

  // Load an image element directly from a URL (assets). Returns the element or throws.
  private async imageElementFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }

  // Prepare a small PNG dataURL for the corner logo by fetching the asset and rasterizing it to a canvas.
  private async prepareSmallLogoDataUrl(logoPath = '/assets/logo-small.svg', logoWmm = 30, logoHmm = 12): Promise<void> {
    try {
      const resp = await fetch(logoPath);
      if (!resp.ok) { this.smallLogoDataUrl = null; return; }
      const blob = await resp.blob();
      const rawDataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = (err) => reject(err);
        fr.readAsDataURL(blob);
      });

      const img = await this.imageElementFromDataUrl(rawDataUrl);
      const dpi = 96 * this.CAPTURE_SCALE;
      const pxW = Math.max(1, Math.round((logoWmm / 25.4) * dpi));
      const pxH = Math.max(1, Math.round((logoHmm / 25.4) * dpi));
      const canvas = document.createElement('canvas');
      canvas.width = pxW;
      canvas.height = pxH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { this.smallLogoDataUrl = null; return; }
      // draw image to fit the canvas
      ctx.clearRect(0, 0, pxW, pxH);
      // preserve aspect ratio and fit (contain)
      const ratioImg = img.width / img.height || 1;
      const ratioCanvas = pxW / pxH;
      let drawW = pxW, drawH = pxH;
      if (ratioImg > ratioCanvas) {
        drawW = pxW;
        drawH = Math.round(pxW / ratioImg);
      } else {
        drawH = pxH;
        drawW = Math.round(pxH * ratioImg);
      }
      const offsetX = Math.round((pxW - drawW) / 2);
      const offsetY = Math.round((pxH - drawH) / 2);
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      this.smallLogoDataUrl = canvas.toDataURL('image/png');
      console.debug('[ReportGenerator] prepared small logo dataUrl len', this.smallLogoDataUrl.length);
    } catch (e) {
      console.debug('[ReportGenerator] could not prepare small logo', e);
      this.smallLogoDataUrl = null;
    }
  }

  // Updated logic to synchronize selectedGraficoId with checkboxes
  public updateSelectedGrafico(id: string): void {
    this.selectedGraficoId = id;
    this.graficos.forEach(grafico => {
      grafico.seleccionado = grafico.id === id;
    });
  }

  // Updated isSelected method to rely on selectedGraficoId
  public isSelected(id: string): boolean {
    return this.selectedGraficoId === id;
  }

  // Helper para checar si un gráfico está seleccionado por id (usado en templates)
  isSelectedOld(id: string): boolean {
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
  // Load background and prepare small logo once before rendering pages so they're available
  // even if some questions don't produce a chart.
  await this.loadPdfBackground(pageWidth, pageHeight, 0.12);
  await this.prepareSmallLogoDataUrl('/assets/logo-small.svg', 30, 12);
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

              // Background (draw first so content sits on top)
              if (this.pdfBackgroundDataUrl) {
                const bgFormat = (this.pdfBackgroundDataUrl.indexOf('data:image/png') === 0) ? 'PNG' : 'JPEG';
                try {
                  // try adding as an HTMLImageElement first (sometimes more reliable)
                  const imgEl = await this.imageElementFromDataUrl(this.pdfBackgroundDataUrl);
                  try {
                    (doc as any).addImage(imgEl, bgFormat, 0, 0, pageWidth, pageHeight);
                    console.debug('[ReportGenerator] drew background (image element) on page', pageIndex);
                  } catch (innerErr) {
                    // fallback to data URL string
                    doc.addImage(this.pdfBackgroundDataUrl, bgFormat, 0, 0, pageWidth, pageHeight);
                    console.debug('[ReportGenerator] drew background (data URL) on page', pageIndex);
                  }
                  // Draw prepared small logo (rasterized PNG) in the top-left if available
                  try {
                    if (this.smallLogoDataUrl) {
                      doc.addImage(this.smallLogoDataUrl, 'PNG', margin, margin - 2, 30, 12);
                      console.debug('[ReportGenerator] drew prepared small logo on page', pageIndex);
                    }
                  } catch (logoErr) {
                    console.debug('[ReportGenerator] error drawing prepared small logo', logoErr);
                  }
                } catch (e) {
                  // if background embedding fails, continue without it
                  console.debug('[ReportGenerator] could not draw background on page', e);
                }
              }

          // Report title (top-center)
          doc.setFontSize(20);
          doc.setFont(undefined as any, 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Reporte de Resultados de Encuesta', pageWidth / 2, margin + 6, { align: 'center' });

          // thin separator
          doc.setDrawColor(200);
          doc.setLineWidth(0.5);
          doc.line(margin, margin + 9, pageWidth - margin, margin + 9);

          // Meta line (red) under title
          doc.setFontSize(10);
          doc.setFont(undefined as any, 'normal');
          doc.setTextColor(180, 20, 20);
          const encuestaLabel = (this.kpisGenerales && (this.kpisGenerales as any).nombreEncuesta) ? (this.kpisGenerales as any).nombreEncuesta : 'Encuesta';
          const municipio = (this.currentFilters && (this.currentFilters as any).id_municipio) ? (this.currentFilters as any).id_municipio : 'Todos';
          const seccion = (this.currentFilters && (this.currentFilters as any).id_seccion) ? (this.currentFilters as any).id_seccion : 'Todas';
          const comunidad = (this.currentFilters && (this.currentFilters as any).id_comunidad) ? (this.currentFilters as any).id_comunidad : '';
          const metaParts = [`Encuesta: ${encuestaLabel}`, `Municipio: ${municipio}`, `Sección: ${seccion}`];
          if (comunidad) metaParts.push(`Comunidad: ${comunidad}`);
          const metaLine = metaParts.join(' | ');
          doc.text(metaLine, pageWidth / 2, margin + 14, { align: 'center' });

          // Question title
          doc.setFontSize(16);
          doc.setFont(undefined as any, 'bold');
          doc.setTextColor(0, 0, 0);
          const headerY = margin + 24;
          doc.text(question.texto_pregunta, pageWidth / 2, headerY, { align: 'center' });

          // MetaY used to reserve vertical space
          let metaY = headerY + 8;

          // Use Chart.js to render an offscreen canvas for the question's data
          const resultsForQuestion = questionResultsById[question.id_pregunta] || [];
          if (resultsForQuestion && resultsForQuestion.length > 0) {
            try {
              const { imgData, width: cW, height: cH } = await this.createChartImage(question.id_pregunta, resultsForQuestion);

              // Convert returned pixel dimensions into mm for jsPDF using the same effective DPI
              let imgWidthMm = this.pxToMm(cW);
              let imgHeightMm = this.pxToMm(cH);

              // Reserve space already used by header/meta (metaY is in mm)
              const reservedHeight = (metaY - margin) + 12;
              const availableHeight = contentHeight - reservedHeight;

              // Fit the image into the available content area while preserving aspect ratio
              if (imgHeightMm > availableHeight) {
                const scale = availableHeight / imgHeightMm;
                imgHeightMm = imgHeightMm * scale;
                imgWidthMm = imgWidthMm * scale;
              }
              if (imgWidthMm > contentWidth) {
                const scale = contentWidth / imgWidthMm;
                imgWidthMm = imgWidthMm * scale;
                imgHeightMm = imgHeightMm * scale;
              }

              const imgX = (pageWidth - imgWidthMm) / 2;
              const imgY = metaY + 6;

              // Determine image format for jsPDF
              try {
                // Compose the chart region so the prepared background shows under the chart
                const composedRegion = await this.composeChartRegionWithBackground(imgData, cW, cH, pageWidth, pageHeight, imgX, imgY, imgWidthMm, imgHeightMm);
                doc.addImage(composedRegion, 'PNG', imgX, imgY, imgWidthMm, imgHeightMm);
              } catch (composeErr) {
                // fallback: add the chart image directly
                const format = (typeof imgData === 'string' && imgData.indexOf('data:image/png') === 0) ? 'PNG' : 'JPEG';
                doc.addImage(imgData, format, imgX, imgY, imgWidthMm, imgHeightMm);
              }
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

          // small center URL above the footer
          try {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text('www.votayopina.com', pageWidth / 2, pageHeight - margin - 8, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          } catch (e) {
            // ignore
          }

          // Footer: page numbering
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