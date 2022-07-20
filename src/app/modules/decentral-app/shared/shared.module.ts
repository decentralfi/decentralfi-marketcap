import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/*Angular Flex box*/
import { FlexLayoutModule } from '@angular/flex-layout';

/*Angular Material*/
import { CdkTableModule } from '@angular/cdk/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';

/*Font Awesome*/
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/* NgSelect*/
import { NgSelectModule } from '@ng-select/ng-select';

/*Shared Components*/
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SidebarFooterComponent } from './sidebar/sidebar-footer/sidebar-footer.component';
import { LoaderComponent } from './loader/loader.component';
import { ErrorComponent } from './error/error.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { FaqComponent } from './faq/faq.component';
import { DForgetWalletComponent } from '../shared/dialogs/forget-wallet/forget-wallet.component';
import { DConnectWalletComponent } from '../shared/dialogs/connect-wallet/connect-wallet.component';
/* Pipe for long values */
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    SidebarFooterComponent,
    LoaderComponent,
    ErrorComponent,
    ComingSoonComponent,
    FaqComponent,
    RoundedValuePipe,
    DForgetWalletComponent,
    DConnectWalletComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    CdkTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatSelectModule,
    MatChipsModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRadioModule,
    FontAwesomeModule,
    NgSelectModule,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    CdkTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRippleModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDialogModule,
    MatRadioModule,
    HeaderComponent,
    SidebarComponent,
    SidebarFooterComponent,
    LoaderComponent,
    ErrorComponent,
    ComingSoonComponent,
    FaqComponent,
    FontAwesomeModule,
    NgSelectModule,
    RoundedValuePipe,
  ],
})
export class SharedModule {}
