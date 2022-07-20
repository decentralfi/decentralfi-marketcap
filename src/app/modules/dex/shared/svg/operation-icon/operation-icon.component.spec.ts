import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationIconComponent } from './operation-icon.component';

describe('OperationIconComponent', () => {
  let component: OperationIconComponent;
  let fixture: ComponentFixture<OperationIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OperationIconComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
