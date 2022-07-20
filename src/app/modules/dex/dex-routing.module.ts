import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DexComponent } from './dex.component';

// Routes
const routes: Routes = [
  {
    path: '',
    component: DexComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./marketcap/marketcap.module').then((m) => m.MarketcapModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DexRoutingModule {}
