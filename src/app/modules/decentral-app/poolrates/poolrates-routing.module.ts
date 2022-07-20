import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PoolratesComponent } from './poolrates.component';

// Routes
const routes: Routes = [{ path: '', component: PoolratesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PoolratesRoutingModule {}
