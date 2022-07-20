import { TestBed } from '@angular/core/testing';

import { XDEFIService } from './xdefi.service';

describe('XdefiService', () => {
  let service: XDEFIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XDEFIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
