import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';

/* Master Wallet Manager */
import { MasterWalletManagerService } from './services/master-wallet-manager.service';

import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { MockClientService } from 'src/app/services/mock-client.service';
import { AppUpdateService } from 'src/app/services/app-update.service';

import { DecimalPipe } from '@angular/common';
import { RoundedValuePipe } from 'src/app/modules/dex/shared/pipes/rounded-value.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    AppRoutingModule,
    HttpClientModule,
    MatDialogModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
    }),
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-US' },
    MasterWalletManagerService,
    GlobalChartsThemeService,
    DecimalPipe,
    RoundedValuePipe,
    MockClientService,
    AppUpdateService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
