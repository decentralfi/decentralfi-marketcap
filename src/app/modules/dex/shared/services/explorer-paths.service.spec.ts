import { TestBed } from '@angular/core/testing';

import { ExplorerPathsService } from './explorer-paths.service';

describe('ExporerPathsService', () => {
  let service: ExplorerPathsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExplorerPathsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
