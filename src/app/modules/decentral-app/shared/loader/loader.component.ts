import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../services/loader.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {

  loaderOverlay: string;
  isAliveCounter: number;
  logo: string;
  constructor(private loaderService: LoaderService,private chartThemeService: GlobalChartsThemeService) { }

  ngOnInit() {

    this.chartThemeService.getGlobalChartTheme().subscribe(theme =>{
      if(theme == 'light-theme'){
        this.logo = 'decentralfi-light.svg';
      }else{
        this.logo = 'decentralfi-dark.svg';
      }
    });

    this.loaderService.loaderOverlay.subscribe((val: string) => {
      this.loaderOverlay = val;
    });

    this.loaderService.confimationPerc.subscribe((val: number) => {
      this.isAliveCounter = val;
    });

  }



}
