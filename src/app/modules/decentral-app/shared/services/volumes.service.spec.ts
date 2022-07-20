/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VolumesService } from './volumes.service';

describe('Service: Volumes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VolumesService]
    });
  });

  it('should ...', inject([VolumesService], (service: VolumesService) => {
    expect(service).toBeTruthy();
  }));
});
