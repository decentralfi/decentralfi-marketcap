import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DexComponent } from './dex.component';

// Routes
const routes: Routes = [
  {
    path: '',
    component: DexComponent,
    children: [
      /*{
        path: '',
        redirectTo: 'marketcap',
        pathMatch: 'full'
      },*/
      {
        path: '',
        loadChildren: () =>
          import('./marketcap/marketcap.module').then((m) => m.MarketcapModule),
      },
      {
        path: 'liquidity',
        loadChildren: () =>
          import('./liquidity/liquidity.module').then((m) => m.LiquidityModule),
      },
      /*{
        path: 'swap',
        loadChildren: () => import('./swap/swap.module').then(m => m.SwapModule)
      },
      {
        path: 'add',
        loadChildren: () => import('./add/add.module').then(m => m.AddModule)
      },*/
      {
        path: 'pool/:asset',
        loadChildren: () =>
          import('./pool-detail/pool-detail.module').then(
            (m) => m.PoolDetailModule
          ),
      },
      {
        path: 'wallet',
        loadChildren: () =>
          import('./wallet-manager/wallet-manager.module').then(
            (m) => m.WalletManagerModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DexRoutingModule {}
