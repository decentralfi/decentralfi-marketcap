/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { GlobalCurrencyService } from './global-currency.service';

describe('Service: GlobalCurrency', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalCurrencyService]
    });
  });

  it('should ...', inject([GlobalCurrencyService], (service: GlobalCurrencyService) => {
    expect(service).toBeTruthy();
  }));
});
