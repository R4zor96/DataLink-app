import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeatmapMapComponent } from './heatmap-map.component';

describe('HeatmapMapComponent', () => {
  let component: HeatmapMapComponent;
  let fixture: ComponentFixture<HeatmapMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeatmapMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeatmapMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
