import { TestBed } from '@angular/core/testing';

import { KeystoreTransferService } from './keystore-transfer.service';

describe('KeystoreTransferService', () => {
  let service: KeystoreTransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeystoreTransferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
