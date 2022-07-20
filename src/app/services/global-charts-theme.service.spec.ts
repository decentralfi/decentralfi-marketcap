import { TestBed } from '@angular/core/testing';

import { GlobalChartsThemeService } from './global-charts-theme.service';

describe('GlobalChartsThemeService', () => {
  let service: GlobalChartsThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalChartsThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
