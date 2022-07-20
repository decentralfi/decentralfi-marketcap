import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookie-msg',
  templateUrl: './cookie-msg.component.html',
  styleUrls: ['./cookie-msg.component.scss'],
})
export class CookieMsgComponent implements OnInit {
  public hideOverlay: boolean = false;
  public logoFile = 'decentralfi-logo.svg';
  public cookieOverlayClass = 'cookie-overlay';
  constructor() {}

  ngOnInit() {
    let cookie = localStorage.getItem('dcf-cookie');
    if (cookie == null) {
      localStorage.setItem('dcf-cookie', 'false');
    } else {
      if (cookie == 'true') {
        this.cookieOverlayClass = 'cookie-overlay hide';
      }
    }
  }

  close() {
    localStorage.setItem('dcf-cookie', 'true');
    this.cookieOverlayClass = 'cookie-overlay hide';
  }
}
