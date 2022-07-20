/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { WalletBalanceService } from './wallet-balance.service';

describe('Service: WalletBalance', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WalletBalanceService]
    });
  });

  it('should ...', inject([WalletBalanceService], (service: WalletBalanceService) => {
    expect(service).toBeTruthy();
  }));
});
