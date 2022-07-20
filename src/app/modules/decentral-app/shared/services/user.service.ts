import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { UserData } from '../interfaces/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private endpointUrl = environment.endpoint;
  private captchaSecret = environment.captchaSecret;

  constructor(private http: HttpClient) {}

  public login(email: string, password: string) {
    let user = {
      email: email,
      password: password,
    };
    return this.http.post(this.endpointUrl + 'login/', user);
  }

  public logout(key: string) {
    return this.http.get(this.endpointUrl + 'logout/' + key + '/');
  }

  public registerMail(email: string) {
    let user = {
      email: email,
    };
    return this.http.post(this.endpointUrl + 'register/email/', user);
  }

  public verifyToken(key: string) {
    return this.http.get(this.endpointUrl + 'confirmation/email/' + key + '/');
  }

  public confirmEmailRegistration(key: string): Observable<UserData> {
    let body = { data: '' };
    return this.http.post<UserData>(
      this.endpointUrl + 'confirmation/email/' + key + '/',
      body
    );
  }

  public registerUser(password: string, token: string) {
    let user = {
      password1: password,
      password2: password,
      terms_conditions: true,
    };
    return this.http.post(
      this.endpointUrl + 'register/user/' + token + '/',
      user
    );
  }

  public recoveryMail(email: string) {
    let user = {
      email: email,
    };
    return this.http.post(this.endpointUrl + 'password/recovery/', user);
  }

  public confirmRecoveryEmail(key: string) {
    return this.http.get(
      this.endpointUrl + 'confirmation/password/' + key + '/'
    );
  }

  public recoveryUser(password: string, id: string) {
    let user = {
      password1: password,
      password2: password,
      terms_conditions: true,
    };
    return this.http.post(
      this.endpointUrl + 'restore/password/' + id + '/',
      user
    );
  }

  public isLoggedIn() {
    let user = localStorage.getItem('dcf-user');
    if (localStorage.getItem('dcf-user') && user.length > 0) {
      return true;
    } else {
      return false;
    }
  }
}
