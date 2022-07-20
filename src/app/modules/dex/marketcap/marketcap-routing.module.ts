import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MarketcapComponent } from './marketcap.component';
//import { PoolComponent } from './pool/pool.component';

// Routes
const routes: Routes = [
  { path: '', component: MarketcapComponent },
  //{ path: 'pool/:asset', component: PoolComponent }
  /*{
    path: 'pool/:asset',
    loadChildren: () =>
      import('./pool-detail/pool-detail.module').then(
        (m) => m.PoolDetailModule
      ),
  },*/
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarketcapRoutingModule {}
