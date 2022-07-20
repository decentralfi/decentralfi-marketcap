import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefibotsRoutingModule } from './defibots-routing.module';
import { DefibotsComponent } from './defibots.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    DefibotsRoutingModule,
    SharedModule
  ],
  declarations: [DefibotsComponent]
})
export class DefibotsModule { }
