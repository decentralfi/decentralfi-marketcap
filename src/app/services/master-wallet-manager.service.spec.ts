import { TestBed } from '@angular/core/testing';

import { MasterWalletManagerService } from './master-wallet-manager.service';

describe('MasterWalletManagerService', () => {
  let service: MasterWalletManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MasterWalletManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
