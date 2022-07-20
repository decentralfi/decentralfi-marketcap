import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PoolratesRoutingModule } from './poolrates-routing.module';
import { PoolratesComponent } from './poolrates.component';
import { SharedModule } from '../shared/shared.module';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatSelectModule } from '@angular/material/select';
import { PoolratesService } from '../shared/services/poolrates.service';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';

@NgModule({
  imports: [
    CommonModule,
    PoolratesRoutingModule,
    SharedModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ],
  providers: [PoolratesService, RoundedValuePipe],
  declarations: [PoolratesComponent],
})
export class PoolratesModule {}
