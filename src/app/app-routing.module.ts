import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const appRoutes: Routes = [
  {
    path: 'dex',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'landing',
    loadChildren: () =>
      import('./modules/landing/landing.module').then((m) => m.LandingModule),
  },
  {
    path: 'app',
    loadChildren: () =>
      import('./modules/decentral-app/decentral-app.module').then(
        (m) => m.DecentralAppModule
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/dex/dex.module').then((m) => m.DexModule),
  },
  {
    path: '**',
    redirectTo: '404',
  },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(appRoutes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
