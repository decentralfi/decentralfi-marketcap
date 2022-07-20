/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BinanceService } from './binance.service';

describe('Service: Binance', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BinanceService]
    });
  });

  it('should ...', inject([BinanceService], (service: BinanceService) => {
    expect(service).toBeTruthy();
  }));
});
