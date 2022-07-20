/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { GlobalTimePeriodService } from './global-time-period.service';

describe('Service: GlobalTimePeriod', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalTimePeriodService]
    });
  });

  it('should ...', inject([GlobalTimePeriodService], (service: GlobalTimePeriodService) => {
    expect(service).toBeTruthy();
  }));
});
