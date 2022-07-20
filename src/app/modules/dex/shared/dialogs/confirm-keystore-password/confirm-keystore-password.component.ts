import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { KeystoreService } from '@dexShared/services/keystore.service';
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

interface iData {
  swapConfirmed: boolean;
}

@Component({
  selector: 'app-confirm-keystore-password',
  templateUrl: './confirm-keystore-password.component.html',
  styleUrls: ['./confirm-keystore-password.component.scss'],
})
export class ConfirmKeystorePasswordComponent implements OnInit {
  public keystorePassword: string;
  public passwordHide = true;
  public keystoreConnecting: boolean;
  public keystoreError: boolean;
  public keystoreErrorMsg: string;
  public language: string;
  public translation: any;

  constructor(
    public dialogRef: MatDialogRef<ConfirmKeystorePasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: iData,
    private keystoreService: KeystoreService,
    private userService: UserService,
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

  closeDialog() {
    this.dialogRef.close({ yes: false });
  }

  keystoreConnect() {
    if (this.keystorePassword && this.keystorePassword.length > 0) {
      this.keystoreConnecting = true;
      this.keystoreError = false;

      setTimeout(() => {
        this.keystoreUnlock();
      }, 100);
    } else {
      this.keystoreError = true;
      this.keystoreErrorMsg =
        this.translation.confirm_keystore_tx.error_msgs.empty;
    }
  }

  async keystoreUnlock() {
    this.keystoreError = false;
    try {
      const keystoreData = localStorage.getItem('keystore');

      const user = await this.keystoreService.unlockKeystore(
        JSON.parse(keystoreData),
        this.keystorePassword
      );
      this.userService.setUser(user);

      this.dialogRef.close({ yes: true });
    } catch (error: any) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      this.keystoreErrorMsg =
        this.translation.confirm_keystore_tx.error_msgs.invalid;
      console.error(error);
    }
  }
}
