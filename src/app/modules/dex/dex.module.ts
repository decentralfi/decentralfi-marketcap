import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecimalPipe } from '@angular/common';

// COMPONENTS
import { DexComponent } from './dex.component';

// ROUTING
import { DexRoutingModule } from './dex-routing.module';

// SERVICES
import { LoaderService } from './shared/services/loader.service';
import { WalletBalanceService } from './shared/services/wallet-balance.service';
import { MidgardService } from './shared/services/midgard.service';
import { LiquidityService } from './shared/services/liquidity.service';
import { MarketcapService } from './shared/services/marketcap.service';
import { MarketcapOperationsService } from './shared/services/marketcap-operations.service';

// PIPES
import { RoundedValuePipe } from './shared/pipes/rounded-value.pipe';

// MODULES
import { SharedModule } from './shared/shared.module';
import { MarketcapModule } from './marketcap/marketcap.module';

@NgModule({
  imports: [CommonModule, DexRoutingModule, SharedModule, MarketcapModule],
  providers: [
    LoaderService,
    WalletBalanceService,
    MidgardService,
    LiquidityService,
    MarketcapService,
    MarketcapOperationsService,
    DecimalPipe,
    RoundedValuePipe,
  ],
  declarations: [DexComponent],
})
export class DexModule {}
