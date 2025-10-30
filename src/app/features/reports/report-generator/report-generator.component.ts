import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// 🧩 Importamos los componentes reutilizables del dashboard
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../shared/components/heatmap-map/heatmap-map.component';
import { PieChartComponent } from '../../../shared/components/pie-chart/pie-chart.component';
import { BarChartComponent } from '../../../shared/components/bar-chart/bar-chart.component';
// Removed unused chart components imports (not used in this component's template)

// 🧠 Modelos que ya usa tu dashboard
import { KpisGenerales, Ubicacion, QuestionResultDto } from '../../../shared/models/dashboard.models';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KpiCardComponent,
    HeatmapMapComponent,
    PieChartComponent,
    BarChartComponent,
    // GaugeChartComponent and VerticalBarChartComponent removed because they are not used here
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
  graficos: { id: string, nombre: string, seleccionado: boolean }[] = [
    { id: 'demografia', nombre: 'Demografía', seleccionado: false },
    { id: 'mapa', nombre: 'Mapa Geográfico', seleccionado: false },
    { id: 'preferencias', nombre: 'Preferencias Electorales', seleccionado: false }
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

  // Getters para mantener la plantilla existente que usa propiedades planas
  // Devuelven string|number para encajar con el Input de `KpiCardComponent` (number | string)
  get municipiosCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.municipios ?? 'N/A';
  }

  get distritosLocalesCubiertos(): number | string {
    return this.kpisGenerales?.cobertura?.distritosLocales ?? 'N/A';
  }

  ngOnInit(): void {
    console.log('ReportGeneratorComponent cargado ✅');
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
