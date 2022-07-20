import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationsButtonsComponent } from './operations-buttons.component';

describe('OperationsButtonsComponent', () => {
  let component: OperationsButtonsComponent;
  let fixture: ComponentFixture<OperationsButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OperationsButtonsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationsButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
