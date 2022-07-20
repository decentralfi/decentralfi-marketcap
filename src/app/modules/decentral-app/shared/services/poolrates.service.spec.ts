/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PoolratesService } from './poolrates.service';

describe('Service: Poolrates', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoolratesService]
    });
  });

  it('should ...', inject([PoolratesService], (service: PoolratesService) => {
    expect(service).toBeTruthy();
  }));
});
