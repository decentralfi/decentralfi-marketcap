import { Injectable } from '@angular/core'
import { Router, CanActivate } from '@angular/router'
import { UserService } from './user.service';

@Injectable()
export class LoginGuardService implements CanActivate {
  constructor(private user: UserService, private router: Router) {}

  canActivate() {
    if (!this.user.isLoggedIn()) {
      this.router.navigateByUrl('/app/login');
      return false;
    }
    return true;
  }
}