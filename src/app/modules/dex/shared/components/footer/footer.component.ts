import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dcf-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  public logoFile: string = 'decentralfi-logo.svg';

  constructor() { }

  ngOnInit() {
  }

}
