import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MasterWalletManagerService } from '@app/services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

interface iData {
  swapConfirmed: boolean;
}

@Component({
  selector: 'app-forget-wallet',
  templateUrl: './forget-wallet.component.html',
  styleUrls: ['./forget-wallet.component.scss'],
})
export class ForgetWalletComponent implements OnInit {

  selectedOption: boolean = true;

  public language: string;
  public translation: any;

  constructor(
    public dialogRef: MatDialogRef<ForgetWalletComponent>,
    @Inject(MAT_DIALOG_DATA) public data: iData,
    public translate: TranslateService,
    private marketcapService: MasterWalletManagerService,
  ) {
    this.marketcapService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  ngOnInit() {}

  closeDialog(bool: boolean){
    this.dialogRef.close({yes: bool, type: this.selectedOption});
  }
}
