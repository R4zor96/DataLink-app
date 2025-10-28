import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Importa FormsModule
import jsPDF from 'jspdf';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ Agrégalo aquí
  templateUrl: './report-generator.component.html',
  styleUrl: './report-generator.component.css'
})
export class ReportGeneratorComponent {
  dataSummary: any = null; // 👈 Agregado para evitar el error
  // Estado de los gráficos seleccionados
  charts = {
    demografia: false,
    mapa: false,
    preferencias: false
  };

  // Función que genera el PDF
  generarPDF() {
    const doc = new jsPDF();
    doc.text('Reporte de Resultados', 10, 10);
    doc.text('Gráficos seleccionados:', 10, 20);

    let y = 30;
    for (const [key, value] of Object.entries(this.charts)) {
      if (value) {
        doc.text(`- ${key}`, 10, y);
        y += 10;
      }
    }

    doc.save('reporte.pdf');
  }
}
