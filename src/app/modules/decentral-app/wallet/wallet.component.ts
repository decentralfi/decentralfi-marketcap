import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { LoaderService } from '../shared/services/loader.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss'],
})
export class WalletComponent implements OnInit, AfterViewInit {
  public img: string;

  constructor(
    private loaderService: LoaderService,
    private chartThemeService: GlobalChartsThemeService
  ) {}

  ngOnInit() {
    this.loaderService.loaderShow(1);

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      if (theme == 'light-theme') {
        this.img = 'Wallet-light.png';
      } else {
        this.img = 'Wallet-dark.png';
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loaderService.loaderHide(1);
    }, 1000);
  }
}
