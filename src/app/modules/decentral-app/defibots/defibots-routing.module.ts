import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DefibotsComponent } from './defibots.component';

// Routes
const routes: Routes = [{ path: '', component: DefibotsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DefibotsRoutingModule {}
