import { NgModule } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { WalletManagerComponent } from './wallet-manager.component';
import { WalletManagerRoutingModule } from './wallet-manager-routing.module';
import { SharedModule } from '../shared/shared.module';
import { DecimalPipe } from '@angular/common';
import { ClipboardModule } from 'ngx-clipboard';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

@NgModule({
  imports: [
    CommonModule,
    WalletManagerRoutingModule,
    SharedModule,
    ClipboardModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    DecimalPipe
  ],
  declarations: [WalletManagerComponent]
})
export class WalletManagerModule { }

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
