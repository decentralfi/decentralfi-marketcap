import { TestBed } from '@angular/core/testing';

import { AssestUsdPriceService } from './assest-usd-price.service';

describe('AssestUsdPriceService', () => {
  let service: AssestUsdPriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssestUsdPriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
