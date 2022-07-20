import { Component, OnInit, AfterViewInit } from '@angular/core';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit, AfterViewInit {

  constructor(private loaderService: LoaderService) { }

  ngOnInit() {
    this.loaderService.loaderShow(1);
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.loaderService.loaderHide(1);
    }, 1000);
  }

}
