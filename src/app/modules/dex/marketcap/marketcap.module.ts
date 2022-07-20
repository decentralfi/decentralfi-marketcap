import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { NgxEchartsModule } from 'ngx-echarts';

// COMPONENTS
import { MarketcapComponent } from './marketcap.component';
//import { PoolComponent } from './pool/pool.component';

// MODULES
import { SharedModule } from '../shared/shared.module';
import { MarketcapRoutingModule } from './marketcap-routing.module';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

@NgModule({
  imports: [
    CommonModule,
    MarketcapRoutingModule,
    SharedModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [DecimalPipe],
  declarations: [
    MarketcapComponent,
    //PoolComponent
  ],
  exports: [],
})
export class MarketcapModule {}

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
