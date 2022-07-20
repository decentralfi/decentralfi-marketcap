/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NetworkChainService } from './network-chain.service';

describe('Service: NetworkChain', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NetworkChainService]
    });
  });

  it('should ...', inject([NetworkChainService], (service: NetworkChainService) => {
    expect(service).toBeTruthy();
  }));
});
