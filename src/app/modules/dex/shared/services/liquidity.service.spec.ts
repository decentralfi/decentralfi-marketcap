/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { LiquidityService } from './liquidity.service';

describe('Service: Liquidity', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LiquidityService]
    });
  });

  it('should ...', inject([LiquidityService], (service: LiquidityService) => {
    expect(service).toBeTruthy();
  }));
});
