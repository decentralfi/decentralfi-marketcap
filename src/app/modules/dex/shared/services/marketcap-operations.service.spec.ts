import { TestBed } from '@angular/core/testing';

import { MarketcapOperationsService } from './marketcap-operations.service';

describe('MarketcapOperationsService', () => {
  let service: MarketcapOperationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarketcapOperationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
