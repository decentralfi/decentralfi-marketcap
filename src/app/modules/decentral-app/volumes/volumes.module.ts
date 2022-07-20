import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { VolumesRoutingModule } from './volumes-routing.module';
import { VolumesComponent } from './volumes.component';
import { SharedModule } from '../shared/shared.module';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatSelectModule } from '@angular/material/select';
import { VolumesService } from '../shared/services/volumes.service';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';

@NgModule({
  imports: [
    CommonModule,
    VolumesRoutingModule,
    SharedModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [VolumesService, RoundedValuePipe],
  declarations: [VolumesComponent]
})
export class VolumesModule { }
