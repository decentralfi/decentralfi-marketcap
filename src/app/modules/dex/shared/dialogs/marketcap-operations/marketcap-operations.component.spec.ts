import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketcapOperationsComponent } from './marketcap-operations.component';

describe('MarketcapOperationsComponent', () => {
  let component: MarketcapOperationsComponent;
  let fixture: ComponentFixture<MarketcapOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarketcapOperationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketcapOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
