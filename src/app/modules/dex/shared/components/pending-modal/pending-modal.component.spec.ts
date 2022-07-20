import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingModalComponent } from './pending-modal.component';

describe('PendingModalComponent', () => {
  let component: PendingModalComponent;
  let fixture: ComponentFixture<PendingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
