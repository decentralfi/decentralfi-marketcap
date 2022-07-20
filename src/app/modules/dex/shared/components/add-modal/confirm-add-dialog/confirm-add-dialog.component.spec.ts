import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmAddDialogComponent } from './confirm-add-dialog.component';

describe('ConfirmAddDialogComponent', () => {
  let component: ConfirmAddDialogComponent;
  let fixture: ComponentFixture<ConfirmAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmAddDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
