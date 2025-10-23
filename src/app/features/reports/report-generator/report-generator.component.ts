import { Component } from '@angular/core';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-report-generator',
  templateUrl: './report-generator.component.html',
  styleUrls: ['./report-generator.component.css']
})
export class ReportGeneratorComponent {

  generarPDF() {
    const pdf = new jsPDF();

    // Encabezado del reporte
    pdf.setFontSize(16);
    pdf.text('Reporte de Resultados de Encuesta', 20, 20);

    // Subtítulo o descripción
    pdf.setFontSize(12);
    pdf.text('Generado automáticamente desde el Dashboard del sistema', 20, 30);

    // Simular datos de encuesta
    pdf.setFontSize(10);
    pdf.text('Total de encuestados: 150', 20, 45);
    pdf.text('Nivel de satisfacción: 92%', 20, 55);
    pdf.text('Región: Norte', 20, 65);

    // Guardar el archivo
    pdf.save('reporte_encuesta.pdf');
  }
}
