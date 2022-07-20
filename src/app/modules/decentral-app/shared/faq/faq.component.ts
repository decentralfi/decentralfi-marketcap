import { Component, OnInit, AfterViewInit } from '@angular/core';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit, AfterViewInit {

  public img: string;

  constructor(
    private loaderService: LoaderService,
    private chartThemeService: GlobalChartsThemeService,
    ) { }

  ngOnInit() {
    this.loaderService.loaderShow(1);

    this.chartThemeService.getGlobalChartTheme().subscribe(theme =>{
      if(theme == 'light-theme'){
        this.img = 'FAQ-light.png';
      }else{
        this.img = 'FAQ-dark.png';
      }
    });
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.loaderService.loaderHide(1);
    }, 1000);
  }

}
