import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MarketcapOperationsComponent } from '@dexShared/dialogs/marketcap-operations/marketcap-operations.component';
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

interface Operations {
  chain: string;
  ticker: string;
  fullname: string;

  status: string;
}

@Component({
  selector: 'app-operations-buttons',
  templateUrl: './operations-buttons.component.html',
  styleUrls: ['./operations-buttons.component.scss'],
})
export class OperationsButtonsComponent implements OnInit {
  @Input() element: Operations;

  themeValue: string;
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public translation: any;
  public language: string;

  constructor(public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
    ) {}

  ngOnInit(): void {
    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('liquidity').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  openOperationsModal(
    assetChain: string,
    assetName: string,
    assetFullname: string,
    operationType: string,
    status: string
  ) {
    if (status !== 'available') {
      this._snackBar.open(
        'This Pool is not Available, please select another pool',
        '',
        {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );
      return;
    }

    this.themeValue = localStorage.getItem('dcf-theme');

    if (this.themeValue === '' || this.themeValue === 'light-theme') {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);

      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    const dialogRef = this.dialog.open(MarketcapOperationsComponent, {
      data: { assetChain, assetName, assetFullname, operationType },
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
    });

    dialogRef.afterClosed().subscribe((result) => {
      //consoleLog(`Dialog result: ${result}`);
    });
  }
}
