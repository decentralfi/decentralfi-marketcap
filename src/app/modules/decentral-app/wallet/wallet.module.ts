import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { WalletRoutingModule } from './wallet-routing.module';
import { WalletComponent } from './wallet.component';

@NgModule({
  imports: [CommonModule, WalletRoutingModule, SharedModule],
  declarations: [WalletComponent],
})
export class WalletModule {}
