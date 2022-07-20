import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PoolDetailComponent } from './pool-detail.component';

// Routes
const routes: Routes = [{ path: '', component: PoolDetailComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoolDetailRoutingModule {}
