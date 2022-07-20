import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { LoaderService } from '../shared/services/loader.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, AfterViewInit {
  public img: string;

  constructor(
    private loaderService: LoaderService,
    private chartThemeService: GlobalChartsThemeService
  ) {}

  ngOnInit() {
    this.loaderService.loaderShow(1);

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      if (theme == 'light-theme') {
        this.img = 'Setting-light.png';
      } else {
        this.img = 'Setting-dark.png';
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loaderService.loaderHide(1);
    }, 1000);
  }
}
