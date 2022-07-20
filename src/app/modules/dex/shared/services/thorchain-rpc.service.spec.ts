import { TestBed } from '@angular/core/testing';

import { ThorchainRpcService } from './thorchain-rpc.service';

describe('ThorchainRpcService', () => {
  let service: ThorchainRpcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThorchainRpcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
