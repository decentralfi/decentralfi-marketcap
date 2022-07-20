import { Component, OnInit, ViewChild, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../shared/services/user.service';
import { consoleLog } from '@app/utils/consoles';
//import { MatPasswordStrengthComponent } from '@angular-material-extensions/password-strength';

@Component({
  selector: 'app-recovery-confirmation',
  templateUrl: './recovery-confirmation.component.html',
  styleUrls: ['./recovery-confirmation.component.scss'],
})
export class RecoveryConfirmationComponent implements OnInit {
  @HostBinding('class') componentCssClass: any;

  @ViewChild('passwordComponent', { static: false })
  //passwordComponent: MatPasswordStrengthComponent;
  showDetails: boolean;
  color = 'black';

  public hide = true;
  public hide2 = true;
  public themeValue = '';
  public isToggle: boolean;
  public logoFile: string = 'DecentralFi-footer.svg';
  public msg: string = '';
  public successMsg: boolean = false;
  public token: string;
  public email: string;
  public userId: string;

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private userService: UserService,
    private router: Router,
    private _snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.url[2].path;
    consoleLog(this.token);

    this.userService
      .confirmRecoveryEmail(this.token)
      .subscribe((response: any) => {
        if (response.details) {
          this.msg = response.details;
        } else {
          this.email = response.user.email;
          this.userId = response.id;
        }
      });

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = false;
      this.componentCssClass = this.themeValue;
      this.logoFile = 'DecentralFi-footer.svg';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = true;
      this.componentCssClass = this.themeValue;
      this.logoFile = 'DecentralFi-dark.svg';
    }
  }

  setTheme() {
    if (this.themeValue == 'light-theme') {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.componentCssClass = this.themeValue;
      this.logoFile = 'DecentralFi-dark.svg';
    } else {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.componentCssClass = this.themeValue;
      this.logoFile = 'DecentralFi-footer.svg';
    }
  }

  /*confirm() {
    if (
      this.passwordComponent.passwordFormControl.invalid ||
      this.passwordComponent.passwordConfirmationFormControl.invalid
    ) {
      return;
    }

    this.userService
      .recoveryUser(
        this.passwordComponent.passwordFormControl.value,
        this.userId
      )
      .subscribe(
        (response: any) => {
          if (response.is_active) {
            this.successMsg = true;
          }
          if (response.details) {
            this._snackBar.open(response.details, '', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        },
        (error) => {
          this._snackBar.open(error.error.details, '', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }
      );
  }*/

  goTo(url: string) {
    this.router.navigate([url]);
  }
}
