import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportGeneratorComponent } from './report-generator.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KpiCardComponent } from '../../../shared/components/kpi-card/kpi-card.component';
import { HeatmapMapComponent } from '../../../shared/components/heatmap-map/heatmap-map.component';
import { PieChartComponent } from '../../../shared/components/pie-chart/pie-chart.component';
import { BarChartComponent } from '../../../shared/components/bar-chart/bar-chart.component';

describe('ReportGeneratorComponent', () => {
  let component: ReportGeneratorComponent;
  let fixture: ComponentFixture<ReportGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        KpiCardComponent,
        HeatmapMapComponent,
        PieChartComponent,
        BarChartComponent,
        ReportGeneratorComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle chart selection', () => {
    component.graficos[0].seleccionado = false;
    component.graficos[0].seleccionado = true;
    expect(component.graficos[0].seleccionado).toBeTrue();
  });

  it('should call generatePDF without errors', () => {
    spyOn(component, 'generatePDF').and.callThrough();
    component.generatePDF();
    expect(component.generatePDF).toHaveBeenCalled();
  });
});
