import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

/* Angular Flex box */
import { FlexLayoutModule } from '@angular/flex-layout';

/* Font Awesome */
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/*Angular MATERIAL*/
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';

import { NgxCurrencyModule } from 'ngx-currency';

/* NgSelect*/
import { NgSelectModule } from '@ng-select/ng-select';

/* SHARED DIALOGS */
import { LoaderComponent } from './loader/loader.component';
import { ForgetWalletComponent } from './dialogs/forget-wallet/forget-wallet.component';
import { ConnectWalletComponent } from './dialogs/connect-wallet/connect-wallet.component';
import { AssetsDialogComponent } from './dialogs/assets-dialog/assets-dialog.component';
import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
import { ConfirmKeystorePasswordComponent } from './dialogs/confirm-keystore-password/confirm-keystore-password.component';
import { RecieveWalletComponent } from './dialogs/recieve-wallet/recieve-wallet.component';

import { MarketcapOperationsComponent } from './dialogs/marketcap-operations/marketcap-operations.component';
import { ConfirmSwapDialogComponent } from './components/swap-modal/confirm-swap-dialog/confirm-swap-dialog.component';
import { ConfirmAddDialogComponent } from './components/add-modal/confirm-add-dialog/confirm-add-dialog.component';
import { ConfirmWithdrawDialogComponent } from './components/withdraw-modal/confirm-withdraw-dialog/confirm-withdraw-dialog.component';
import { ConfirmSendDialogComponent } from './components/send-modal/confirm-send-dialog/confirm-send-dialog.component';
import { ConfirmTransactionDialogComponent } from './dialogs/confirm-transaction/confirm-transaction.component';

import { PendingComponent } from './snackbars/pending/pending.component';

/* SHARED COMPONENTS */
import { CookieMsgComponent } from './components/cookie-msg/cookie-msg.component';
import { InfoBarComponent } from './components/info-bar/info-bar.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { AddModalComponent } from './components/add-modal/add-modal.component';
import { WithdrawModalComponent } from './components/withdraw-modal/withdraw-modal.component';
import { SwapModalComponent } from './components/swap-modal/swap-modal.component';
import { SendModalComponent } from './components/send-modal/send-modal.component';
import { ModalSectionHeaderComponent } from './components/modal-section-header/modal-section-header.component';
import { OneInputOperationComponent } from './components/one-input-operation/one-input-operation.component';
import { TwoInputOperationComponent } from './components/two-input-operation/two-input-operation.component';

/* Pipe for long values */
import { RoundedValuePipe } from './pipes/rounded-value.pipe';
import { OperationIconComponent } from './svg/operation-icon/operation-icon.component';
import { PendingModalComponent } from './components/pending-modal/pending-modal.component';
import { OperationsButtonsComponent } from './components/operations-buttons/operations-buttons.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { SliderComponent } from './components/slider/slider.component';
import { PageMaintenanceComponent } from './dialogs/page-maintenance/page-maintenance.component';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    FontAwesomeModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    NgSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatRippleModule,
    MatCheckboxModule,
    MatRadioModule,
    NgxCurrencyModule,
    NgxSliderModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [
    LoaderComponent,
    CookieMsgComponent,
    ForgetWalletComponent,
    ConnectWalletComponent,
    AssetsDialogComponent,
    ConfirmDialogComponent,
    ConfirmKeystorePasswordComponent,
    RecieveWalletComponent,
    InfoBarComponent,
    FooterComponent,
    HeaderComponent,
    RoundedValuePipe,
    MarketcapOperationsComponent,
    AddModalComponent,
    WithdrawModalComponent,
    SwapModalComponent,
    SendModalComponent,
    ModalSectionHeaderComponent,
    OneInputOperationComponent,
    TwoInputOperationComponent,
    OperationIconComponent,
    ConfirmAddDialogComponent,
    ConfirmWithdrawDialogComponent,
    ConfirmTransactionDialogComponent,
    ConfirmSwapDialogComponent,
    ConfirmSendDialogComponent,
    PendingComponent,
    PendingModalComponent,
    OperationsButtonsComponent,
    SliderComponent,
    PageMaintenanceComponent,
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    CookieMsgComponent,
    FlexLayoutModule,
    FontAwesomeModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    NgSelectModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatRippleModule,
    MatCheckboxModule,
    MatRadioModule,
    RoundedValuePipe,
    InfoBarComponent,
    FooterComponent,
    HeaderComponent,
    NgxCurrencyModule,
    OperationsButtonsComponent,
    NgxSliderModule,
    SliderComponent,
    PageMaintenanceComponent,
  ],
})
export class SharedModule {}

// required for AOT compilation
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http);
}
