import { Component, HostBinding, OnInit } from '@angular/core';
import { GlobalChartsThemeService } from '@app/services/global-charts-theme.service';

@Component({
  selector: 'app-page-maintenance',
  templateUrl: './page-maintenance.component.html',
  styleUrls: ['./page-maintenance.component.scss'],
})
export class PageMaintenanceComponent implements OnInit {
  // @HostBinding('class') componentCssClass: any;

  constructor(private chartThemeService: GlobalChartsThemeService) {}

  ngOnInit(): void {
    // this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
    //   this.componentCssClass = theme;
    // });
  }
}
