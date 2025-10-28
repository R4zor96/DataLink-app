import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportGeneratorComponent } from './report-generator.component';

describe('ReportGeneratorComponent', () => {
  let component: ReportGeneratorComponent;
  let fixture: ComponentFixture<ReportGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportGeneratorComponent] // ✅ Importa el componente standalone
    }).compileComponents();

    fixture = TestBed.createComponent(ReportGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have charts object defined', () => {
    expect(component.charts).toBeDefined();
  });

  it('should generate a PDF file without errors', () => {
    spyOn(window, 'alert'); // evita que los alert interrumpan el test
    expect(() => component.generarPDF()).not.toThrow();
  });
});
