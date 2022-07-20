import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwoInputOperationComponent } from './two-input-operation.component';

describe('TwoInputOperationComponent', () => {
  let component: TwoInputOperationComponent;
  let fixture: ComponentFixture<TwoInputOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwoInputOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwoInputOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
