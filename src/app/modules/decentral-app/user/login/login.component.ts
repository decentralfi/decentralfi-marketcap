import { Component, OnInit, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { UserService } from '../../shared/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  @HostBinding('class') componentCssClass: any;

  signin: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    password: new FormControl('', [Validators.required]),
  });

  public hide = true;
  public themeValue = '';
  public isToggle: boolean;
  public logoFile: string = 'DecentralFi-footer.svg';
  public msg: string = '';

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
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

  get emailInput() {
    return this.signin.get('email');
  }
  get passwordInput() {
    return this.signin.get('password');
  }

  login() {
    if (this.emailInput.invalid || this.passwordInput.invalid) {
      return;
    }

    this.userService
      .login(this.emailInput.value, this.passwordInput.value)
      .subscribe(
        (response) => {
          localStorage.setItem('dcf-user', JSON.stringify(response));
          this.router.navigate(['/app']);
        },
        (error) => {
          if (error.error.details) {
            this.msg = error.error.details;
          }
        }
      );
  }

  cancel() {
    this.router.navigate(['/']);
  }
}
