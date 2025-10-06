import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRegisterClientComponent } from './dashboard-register-client.component';

describe('DashboardRegisterClientComponent', () => {
  let component: DashboardRegisterClientComponent;
  let fixture: ComponentFixture<DashboardRegisterClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRegisterClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRegisterClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
