import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WalletManagerComponent } from './wallet-manager.component';

// Routes
const routes: Routes = [

  { path: '', component: WalletManagerComponent },

];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WalletManagerRoutingModule { }
