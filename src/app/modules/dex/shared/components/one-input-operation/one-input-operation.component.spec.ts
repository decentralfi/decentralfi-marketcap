import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OneInputOperationComponent } from './one-input-operation.component';

describe('OneInputOperationComponent', () => {
  let component: OneInputOperationComponent;
  let fixture: ComponentFixture<OneInputOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OneInputOperationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OneInputOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
