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

// Configuración de iconos por defecto (sin cambios)
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png'; // Corregido: Faltaba '/' al inicio
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
// 3. Implementa OnDestroy
export class HeatmapMapComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data: Ubicacion[] = [];
  @ViewChild('mapContainer') private mapContainer!: ElementRef;
  private map!: L.Map;
  private heatLayer: any; // Mantenemos 'any' por la naturaleza del plugin

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.map) {
      this.updateHeatmap();
    }
  }

  // 4. Implementa el método ngOnDestroy
  ngOnDestroy(): void {
    if (this.map) {
      this.map.off(); // Desvincula listeners de eventos
      this.map.remove(); // Elimina el mapa y libera recursos
    }
  }

  private initMap(): void {
    // Evita inicializar el mapa dos veces
    if (this.map) { return; }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [19.3191, -98.2386],
      zoom: 9,
    });

    // Usas el mapa base minimalista (correcto)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(this.map);

    // Forzar redimensionamiento (correcto)
    setTimeout(() => {
      this.map?.invalidateSize(); // Usar '?' por seguridad
    }, 0);

    this.updateHeatmap();
  }

  private updateHeatmap(): void {
    if (!this.map) return;

    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null; // Limpia la referencia
    }

    if (!this.data || this.data.length === 0) {
        return; // No hay datos, no creamos nueva capa
    }

    const heatPoints = this.data.map((p) => [
      parseFloat(p.latitud),
      parseFloat(p.longitud),
      0.5, // Intensidad por defecto
    ]);

    // 5. Asegúrate de usar el type casting (L as any) (correcto)
    this.heatLayer = (L as any)
      .heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 12,
      })
      .addTo(this.map);
  }
}
