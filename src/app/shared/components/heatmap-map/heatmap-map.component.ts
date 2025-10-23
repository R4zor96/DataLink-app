import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy // Importa OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

// 1. Importa Leaflet PRIMERO
import * as L from 'leaflet';

// 2. Importa el plugin DESPUÉS
import 'leaflet.heat';

import { Ubicacion } from '../../../shared/models/dashboard.models';

// Configuración de iconos por defecto
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png'; // Corregido
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-heatmap-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heatmap-map.component.html',
  styleUrl: './heatmap-map.component.css',
})
// Implementa OnDestroy
export class HeatmapMapComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: Ubicacion[] = [];
  @ViewChild('mapContainer') private mapContainer!: ElementRef;
  private map!: L.Map;
  private heatLayer: any;

  ngAfterViewInit(): void {
    // Retrasamos ligeramente la inicialización
    setTimeout(() => this.initMap(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Actualiza solo si el mapa ya existe
    if (changes['data'] && this.map) {
      this.updateHeatmap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.off(); // Desvincula listeners
      this.map.remove(); // Elimina el mapa
    }
  }

  private initMap(): void {
    // Evita doble inicialización
    if (this.map || !this.mapContainer?.nativeElement) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [19.3191, -98.2386], // Centro de Tlaxcala
      zoom: 9,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap &copy; CARTO' // Atribución simplificada
    }).addTo(this.map);

    // Invalidar tamaño con retraso
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

    this.updateHeatmap();
  }

  private updateHeatmap(): void {
    if (!this.map) return;

    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }

    if (!this.data || this.data.length === 0) return;

    const heatPoints = this.data.map((p) => [
      parseFloat(p.latitud),
      parseFloat(p.longitud),
      0.5, // Intensidad
    ]);

    // Verificación y Uso Explícito
    const heatLayerFn = (L as any).heatLayer;

    if (typeof heatLayerFn === 'function') {
      console.log("leaflet.heat cargado correctamente."); // Mensaje para depuración
      this.heatLayer = heatLayerFn(heatPoints, { // Llama a la función obtenida
        radius: 25,
        blur: 15,
        maxZoom: 12,
      }).addTo(this.map);
    } else {
      console.error("Error: La función L.heatLayer no se encontró. El plugin 'leaflet.heat' no se cargó correctamente en producción.");
    }
  }
}
