import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para los checkboxes
import { ApiService } from '../../../core/services/api.service';

// 👇 CAMBIA ESTAS IMPORTACIONES 👇
import {
  SurveyQuestion,
  QuestionOption
} from '../../../shared/models/dashboard.models';
// 👆 FIN DEL CAMBIO 👆

// Estructura para manejar los filtros internamente
type SelectedFilters = { [questionId: string]: { [optionId: string]: boolean } };
@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
})
export class FilterSidebarComponent {
  // Recibe la lista de preguntas para construir el menú
  @Input() questions: SurveyQuestion[] = [];
  // Emite el objeto de filtros listo para la API
  @Output() filtersApplied = new EventEmitter<{ [questionId: string]: string[] }>();
  // Emite un evento para cerrar el sidebar
  @Output() close = new EventEmitter<void>();

  // Almacén para las opciones de cada pregunta (para no pedirlas cada vez)
  optionsCache: { [questionId: number]: QuestionOption[] } = {};

  // Objeto para manejar el estado de los checkboxes
  selectedFilters: SelectedFilters = {};

  // Para saber qué panel está abierto
  expandedQuestionId: number | null = null;
  isLoadingOptions: boolean = false;

  constructor(private apiService: ApiService) {}

  // Expande/colapsa una pregunta y carga sus opciones si es necesario
  toggleQuestion(questionId: number) {
    if (this.expandedQuestionId === questionId) {
      this.expandedQuestionId = null; // Cierra si ya estaba abierto
    } else {
      this.expandedQuestionId = questionId;

      // --- 👇 INICIO DE LA CORRECCIÓN 👇 ---
      // Asegura que el objeto exista ANTES de que el HTML intente usarlo.
      if (!this.selectedFilters[questionId]) {
        this.selectedFilters[questionId] = {};
      }
      // --- 👆 FIN DE LA CORRECCIÓN 👆 ---

      // Si no tenemos las opciones en caché, las pedimos
      if (!this.optionsCache[questionId]) {
        this.isLoadingOptions = true;
        this.apiService.getOptionsForQuestion(questionId).subscribe(options => {
          this.optionsCache[questionId] = options;
          this.isLoadingOptions = false;
        });
      }
    }
  }

  // Se llama cada vez que un checkbox cambia
  onCheckboxChange() {
    // Podríamos emitir el filtro en cada cambio, pero es mejor un botón "Aplicar"
    // Por ahora, lo dejamos así para que sea reactivo
  }

  // Limpia todos los filtros de respuesta
  clearAnswerFilters() {
    this.selectedFilters = {};
    this.applyFilters();
  }

  // Convierte el estado de los checkboxes al formato de la API y emite el evento
  applyFilters() {
    // Use a type compatible with the expected answerFilters structure
    const apiFilters: { [questionId: string]: string[] } = {};

    for (const questionId in this.selectedFilters) {
      const selectedOptions = this.selectedFilters[questionId];
      const optionIds = Object.keys(selectedOptions).filter(optionId => selectedOptions[optionId]); // Filtra solo los true

      if (optionIds.length > 0) {
        apiFilters[questionId] = optionIds;
      }
    }

    this.filtersApplied.emit(apiFilters);
    this.close.emit(); // Cierra el sidebar después de aplicar
  }
}
