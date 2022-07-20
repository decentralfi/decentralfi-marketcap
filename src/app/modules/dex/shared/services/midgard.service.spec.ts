/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { MidgardService } from './midgard.service';

describe('Service: Midgard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MidgardService]
    });
  });

  it('should ...', inject([MidgardService], (service: MidgardService) => {
    expect(service).toBeTruthy();
  }));
});
