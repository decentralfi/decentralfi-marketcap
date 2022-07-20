import { Component, OnInit, HostBinding } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { GlobalChartsThemeService } from '@services/global-charts-theme.service';
import { TransactionStatusService } from '@dexShared/services/transaction-status.service';
import { PendingComponent } from '@dexShared/snackbars/pending/pending.component';
import { PageMaintenanceComponent } from '@dexShared/dialogs/page-maintenance/page-maintenance.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dex',
  templateUrl: './dex.component.html',
  styleUrls: ['./dex.component.scss'],
})
export class DexComponent implements OnInit {
  @HostBinding('class') componentCssClass: any;
  dialogBackdropColorClass: string;
  dialogPanelClass: string;

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private txStatusService: TransactionStatusService,
    private _snackBarPending: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.txStatusService.txs$.subscribe((tsx) => {
      if (tsx.length > 0) {
        this._snackBarPending.openFromComponent(PendingComponent, {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: [this.componentCssClass, 'pending-container'],
          announcementMessage: 'No transactions found',
        });
      }
    });

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      this.componentCssClass = theme;
      if (theme === '' || theme === 'light-theme') {
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
        this.dialogPanelClass = 'maintenance-panel-light';
      } else {
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
        this.dialogPanelClass = 'maintenance-panel-dark';
      }
    });

    if (environment.maintenance) {
      this.dialog.open(PageMaintenanceComponent, {
        backdropClass: this.dialogBackdropColorClass,
        panelClass: this.dialogPanelClass,
      });
    }
  }
}
