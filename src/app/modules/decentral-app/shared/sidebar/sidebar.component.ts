import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'dcf-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @ViewChild('drawer', { static: false })
  drawer: MatSidenav;

  @Input() mobileFlag: boolean;
  @Output() toggle = new EventEmitter<string>();
  public toggleclass: string = 'compacted';

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {}

  toggleSidebar() {
    this.toggle.emit(this.toggleclass);
    this.chartThemeService.setToggleSidebar();
  }

  goTo() {
    if (this.mobileFlag == true) {
      this.toggle.emit(this.toggleclass);
    }
  }

  logout() {
    this.router.navigate(['/']);
    /*let user = JSON.parse(localStorage.getItem('dcf-user'));
    consoleLog(user);
    this.userService.logout(user.token).subscribe(response =>{
      consoleLog(response);
      if(this.mobileFlag == true){
        this.toggle.emit(this.toggleclass);
      }
      localStorage.removeItem('dcf-user');
      this.router.navigate(['/app/login']);
    });*/
  }
}
