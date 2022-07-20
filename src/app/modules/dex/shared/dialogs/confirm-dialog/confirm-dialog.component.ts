import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

interface iData {
  swapConfirmed: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent implements OnInit {
  public language: string;
  public translation: any;
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: iData,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {}

  ngOnInit() {
    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  closeDialog(bool: boolean) {
    this.dialogRef.close({ yes: bool });
  }
}
