import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalChartsThemeService {
  private globalTheme = new BehaviorSubject(localStorage.getItem('dcf-theme'));
  private toggleSidebar = new BehaviorSubject(false);

  constructor() {}

  setGlobalChartTheme(theme: string) {
    this.globalTheme.next(theme);
  }

  getGlobalChartTheme() {
    return this.globalTheme.asObservable();
  }

  setToggleSidebar() {
    this.toggleSidebar.next(true);
  }

  getToggleSidebar() {
    return this.toggleSidebar.asObservable();
  }
}
