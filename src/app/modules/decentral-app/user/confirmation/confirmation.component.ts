import { Component, OnInit, ViewChild, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../shared/services/user.service';
import { UserData } from '../../shared/interfaces/user';
import { consoleLog } from '@app/utils/consoles';
//import { MatPasswordStrengthComponent } from '@angular-material-extensions/password-strength';
// this declare var to use plausible custom events
declare var plausible;

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss'],
})
export class ConfirmationComponent implements OnInit {
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
    this.token = this.route.snapshot.url[1].path;

    this.userService.verifyToken(this.token).subscribe((response: any) => {
      if (response.details && response.details == 'Active key_id') {
        consoleLog(response.details);
      } else if (
        response.details &&
        response.details == 'Email is already verified'
      ) {
        consoleLog(response.details);
        this.msg =
          'This email is already verified. Go to <a>Login</a> in order to enter the site.';
      } else if (
        response.details &&
        response.details == 'Email expired, please re-register'
      ) {
        consoleLog(response.details);
        this.msg =
          'This token has exired. Go to <a>register</a> and start your registration again.';
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
      .registerUser(
        this.passwordComponent.passwordFormControl.value,
        this.token
      )
      .subscribe(
        (response: any) => {
          if (response.is_active) {
            this.successMsg = true;
            //trigger plausible custom event
            plausible('Verified Singup');

            this.userService
              .confirmEmailRegistration(this.token)
              .subscribe((user) => {
                if (user.details) {
                  this.msg = user.details;
                } else {
                  this.email = user.email;
                  this.userId = user.id;
                }
              });
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
