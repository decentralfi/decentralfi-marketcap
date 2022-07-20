import {
  Component,
  OnInit,
  HostListener,
  HostBinding,
  ChangeDetectorRef,
} from '@angular/core';

@Component({
  selector: 'dcf-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public sideBarClass = 'main-sidebar expanded';
  public mainColumnClass = 'main-column expanded';
  public sideBarClassExpanded = 'main-sidebar expanded';
  public mainColumnClassExpanded = 'main-column expanded';
  public innerWidth: any;
  public mobileFlag: boolean = false;

  @HostBinding('class') componentCssClass: any;

  @HostListener('window:resize', ['$event']) onResize() {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.sideBarClass = 'main-sidebar expanded';
      this.mainColumnClass = 'main-column expanded';
      this.mobileFlag = false;
    }
    if (this.innerWidth <= 960) {
      this.sideBarClass = 'main-sidebar compacted';
      this.mainColumnClass = 'main-column compacted';
      this.mobileFlag = true;
    }
  }

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.sideBarClass = 'main-sidebar expanded';
      this.mainColumnClass = 'main-column expanded';
      this.mobileFlag = false;
    }
    if (this.innerWidth <= 960) {
      this.sideBarClass = 'main-sidebar compacted';
      this.mainColumnClass = 'main-column compacted';
      this.mobileFlag = true;
    }
  }

  public updateSidebarClass(toggle) {
    let toggleClass = 'main-sidebar ' + toggle;
    let columnToggleClass = 'main-column ' + toggle;
    if (toggleClass == this.sideBarClass) {
      this.sideBarClass = this.sideBarClassExpanded;
      this.mainColumnClass = this.mainColumnClassExpanded;
    } else {
      this.sideBarClass = toggleClass;
      this.mainColumnClass = columnToggleClass;
    }
  }

  ngAfterContentInit() {
    this.cdRef.detectChanges();
  }

  public onSetTheme(theme: string) {
    this.componentCssClass = theme;
  }
}
