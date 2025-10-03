import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Importamos Leaflet directamente
import * as L from 'leaflet';
import 'leaflet.heat';

import { Ubicacion } from '../../../shared/models/dashboard.models';

// El arreglo para los iconos por defecto sigue siendo una buena práctica
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets-marker-icon.png';
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
  imports: [CommonModule], // Ya no necesitamos LeafletModule
  templateUrl: './heatmap-map.component.html',
  styleUrl: './heatmap-map.component.css',
})
export class HeatmapMapComponent implements OnChanges, AfterViewInit {
  @Input() data: Ubicacion[] = [];

  // Usamos @ViewChild para obtener una referencia al div del template
  @ViewChild('mapContainer') private mapContainer!: ElementRef;

  private map!: L.Map;
  private heatLayer: any;

  ngAfterViewInit(): void {
    // Este hook se ejecuta después de que la vista del componente se ha inicializado.
    // Es el lugar perfecto para crear el mapa.
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si los datos cambian y el mapa ya está inicializado, actualizamos el heatmap
    if (changes['data'] && this.map) {
      this.updateHeatmap();
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [19.3191, -98.2386],
      zoom: 9,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    // ----- 👇 ESTA ES LA LÍNEA QUE ARREGLA EL MAPA 👇 -----
    // Forzamos al mapa a detectar el tamaño de su contenedor.
    // El setTimeout asegura que esto se ejecute después de que Angular haya terminado de renderizar.
    setTimeout(() => {
      this.map.invalidateSize();
    }, 0);

    this.updateHeatmap();
  }

  private updateHeatmap(): void {
    // Si el mapa no está listo, no hacemos nada
    if (!this.map) return;

    // Si ya existe una capa de calor, la eliminamos
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
    }

    if (!this.data || this.data.length === 0) return;

    const heatPoints = this.data.map((p) => [
      parseFloat(p.latitud),
      parseFloat(p.longitud),
      0.5,
    ]);

    this.heatLayer = (L as any)
      .heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 12,
      })
      .addTo(this.map);
  }
}
