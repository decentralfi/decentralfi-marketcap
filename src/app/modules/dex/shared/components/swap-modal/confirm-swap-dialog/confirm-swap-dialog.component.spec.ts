import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSwapDialogComponent } from './confirm-swap-dialog.component';

describe('ConfirmSwapDialogComponent', () => {
  let component: ConfirmSwapDialogComponent;
  let fixture: ComponentFixture<ConfirmSwapDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmSwapDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmSwapDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
