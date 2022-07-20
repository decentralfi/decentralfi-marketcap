import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { NetworkRoutingModule } from './network-routing.module';
import { NetworkComponent } from './network.component';
import { SharedModule } from '../shared/shared.module';
import { NetworkService } from '../shared/services/network.service';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';

@NgModule({
  imports: [
    CommonModule,
    NetworkRoutingModule,
    SharedModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ],
  providers: [NetworkService, RoundedValuePipe],
  declarations: [NetworkComponent],
})
export class NetworkModule {}
