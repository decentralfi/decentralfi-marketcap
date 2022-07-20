import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DecentralAppRoutingModule } from './decentral-app-routing.module';

import { LayoutComponent } from './layout-component/layout.component';
import { SharedModule } from './shared/shared.module';
import { VolumesModule } from './volumes/volumes.module';
import { PoolratesModule } from './poolrates/poolrates.module';
/* Global Currency Service */
import { CurrencyService } from './shared/services/currency.service';
/* Global Time Period Service */
import { GlobalTimePeriodService } from './shared/services/global-time-period.service';
/* Global Time Period Service */
import { GlobalCurrencyService } from './shared/services/global-currency.service';
/* Loader Spinner Service */
import { LoaderService } from './shared/services/loader.service';
/* User Service */
import { UserService } from './shared/services/user.service';
import { LoginGuardService } from './shared/services/login-guard.service';

import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { ConfirmationComponent } from './user/confirmation/confirmation.component';
import { RecoveryComponent } from './user/recovery/recovery.component';
import { RecoveryConfirmationComponent } from './user/recovery/recovery-confirmation/recovery-confirmation.component';

// import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';

@NgModule({
  imports: [
    CommonModule,
    DecentralAppRoutingModule,
    SharedModule,
    VolumesModule,
    PoolratesModule,
    // MatPasswordStrengthModule,
  ],
  providers: [
    CurrencyService,
    GlobalCurrencyService,
    GlobalTimePeriodService,
    LoaderService,
    UserService,
    LoginGuardService,
  ],
  declarations: [
    LayoutComponent,
    LoginComponent,
    RegisterComponent,
    ConfirmationComponent,
    RecoveryComponent,
    RecoveryConfirmationComponent,
  ],
})
export class DecentralAppModule {}
