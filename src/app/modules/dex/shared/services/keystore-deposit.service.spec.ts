import { TestBed } from '@angular/core/testing';

import { KeystoreDepositService } from './keystore-deposit.service';

describe('KeystoreDepositService', () => {
  let service: KeystoreDepositService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeystoreDepositService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
