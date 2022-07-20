import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { LandingRoutingModule } from './landing-routing.module';
import { LandingComponent } from './landing/landing.component';

import { FlexLayoutModule } from '@angular/flex-layout';

/*Font Awesome*/
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {MatCardModule} from '@angular/material/card';

import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import { NgxEchartsModule } from 'ngx-echarts';

import {ErrorComponent} from './error/error.component';

import {NewsletterService} from './services/newsletter.service';
import {LandingService} from './services/landing.service';

import {RoundedValuePipe} from './pipes/rounded-value.pipe';


@NgModule({
  declarations: [
    LandingComponent,
    ErrorComponent,
    RoundedValuePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LandingRoutingModule,
    FlexLayoutModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatCardModule,
    FontAwesomeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })
  ],
  providers: [NewsletterService,LandingService,RoundedValuePipe]
})
export class LandingModule { }
