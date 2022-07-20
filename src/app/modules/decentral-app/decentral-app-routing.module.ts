import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LayoutComponent } from './layout-component/layout.component';
import { ErrorComponent } from './shared/error/error.component';
import { FaqComponent } from './shared/faq/faq.component';
import { LoginComponent } from './user/login/login.component';
import { RegisterComponent } from './user/register/register.component';
import { ConfirmationComponent } from './user/confirmation/confirmation.component';
import { RecoveryComponent } from './user/recovery/recovery.component';
import { RecoveryConfirmationComponent } from './user/recovery/recovery-confirmation/recovery-confirmation.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'poolrates',
        pathMatch: 'full',
      },
      {
        path: 'poolrates',
        loadChildren: () =>
          import('./poolrates/poolrates.module').then((m) => m.PoolratesModule),
        //canActivate:[LoginGuardService]
      },
      {
        path: 'volumes',
        loadChildren: () =>
          import('./volumes/volumes.module').then((m) => m.VolumesModule),
        //canActivate:[LoginGuardService]
      },
      {
        path: 'network',
        loadChildren: () =>
          import('./network/network.module').then((m) => m.NetworkModule),
        //canActivate:[LoginGuardService]
      },
      {
        path: 'defibots',
        loadChildren: () =>
          import('./defibots/defibots.module').then((m) => m.DefibotsModule),
        //canActivate:[LoginGuardService]
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.module').then((m) => m.SettingsModule),
        //canActivate:[LoginGuardService]
      },
      {
        path: 'wallet',
        loadChildren: () =>
          import('./wallet/wallet.module').then((m) => m.WalletModule),
        //canActivate:[LoginGuardService]
      },
      {
        path: 'faq',
        component: FaqComponent,
        //canActivate:[LoginGuardService]
      },
      /*{
        path: '404',
        component: ErrorComponent
      },*/
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'confirmation/:key',
    component: ConfirmationComponent,
  },
  {
    path: 'recovery',
    component: RecoveryComponent,
  },
  {
    path: 'recovery/confirmation/:key',
    component: RecoveryConfirmationComponent,
  },
  {
    path: '**',
    redirectTo: '404',
  },
  {
    path: '404',
    component: ErrorComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DecentralAppRoutingModule {}
