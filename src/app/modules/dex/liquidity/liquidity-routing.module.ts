import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LiquidityComponent } from './liquidity.component';

// Routes
const routes: Routes = [{ path: '', component: LiquidityComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LiquidityRoutingModule {}
