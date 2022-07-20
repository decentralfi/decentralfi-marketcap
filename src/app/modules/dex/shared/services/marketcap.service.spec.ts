/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { MarketcapService } from './marketcap.service';

describe('Service: Marketcap', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarketcapService]
    });
  });

  it('should ...', inject([MarketcapService], (service: MarketcapService) => {
    expect(service).toBeTruthy();
  }));
});
