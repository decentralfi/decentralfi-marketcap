import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  HostBinding,
} from '@angular/core';
import { Router } from '@angular/router';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../shared/services/user.service';
// this declare var to use plausible custom events
declare var plausible;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  @HostBinding('class') componentCssClass: any;
  @ViewChild('recaptcha', { static: true }) recaptchaElement: ElementRef;

  signin: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.email, Validators.required]),
    terms: new FormControl('', [Validators.required]),
  });

  public hide = true;
  public themeValue = '';
  public isToggle: boolean;
  public termsFlag: boolean = true;
  public captchaFlag: boolean = true;
  public captchaResponse: string = '';
  public logoFile: string = 'DecentralFi-footer.svg';
  public msg: string = '';

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private userService: UserService,
    private router: Router,
    private _snackBar: MatSnackBar
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

    this.addRecaptchaScript();
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
  get termsInput() {
    return this.signin.get('terms');
  }

  register() {
    if (this.termsInput.value != true) {
      this.termsFlag = false;
    } else {
      this.termsFlag = true;
    }

    if (this.captchaResponse.length > 0) {
      this.captchaFlag = true;
    } else {
      this.captchaFlag = false;
    }

    if (
      this.emailInput.invalid ||
      this.termsInput.value != true ||
      this.captchaResponse.length == 0
    ) {
      return;
    }

    this.userService.registerMail(this.emailInput.value).subscribe(
      (response: any) => {
        this._snackBar.open(response.details, '', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });

        //trigger plausible custom event
        plausible('Singup');
      },
      (error) => {
        this._snackBar.open(error.error.email[0], '', {
          duration: 4000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      }
    );
  }

  cancel() {
    this.router.navigate(['/']);
  }

  renderReCaptcha() {
    window['grecaptcha'].render(this.recaptchaElement.nativeElement, {
      sitekey: '6LcBukQaAAAAAGOjW0M654ljVPz4_FxN9GG5WKo1',
      callback: (response: string) => {
        if (response.length > 0) {
          this.captchaResponse = response;
          this.captchaFlag = true;
        }
      },
    });
  }

  addRecaptchaScript() {
    window['grecaptchaCallback'] = () => {
      this.renderReCaptcha();
    };

    (function (d, s, id, obj) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {
        obj.renderReCaptcha();
        return;
      }
      js = d.createElement(s);
      js.id = id;
      js.src =
        'https://www.google.com/recaptcha/api.js?onload=grecaptchaCallback&amp;render=explicit';
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'recaptcha-jssdk', this);
  }
}
