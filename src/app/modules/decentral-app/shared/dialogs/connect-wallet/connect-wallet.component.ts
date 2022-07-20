import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
//import { KeystoreService } from 'src/app/modules/transactions/services/keystore.service';
import {
  getAddressFromPrivateKey,
  getPrivateKeyFromKeyStore,
} from '@binance-chain/javascript-sdk/lib/crypto';
import { BinanceService } from '@dexShared/services/binance.service';

@Component({
  selector: 'app-connect-wallet',
  templateUrl: './connect-wallet.component.html',
  styleUrls: ['./connect-wallet.component.scss'],
})
export class DConnectWalletComponent implements OnInit {
  public showKeyStoreForm: boolean;
  public file: any;
  public keystorePassword: string;
  public manualWallet: string;
  public keystoreFileSelected: boolean;
  public keystore: any;
  public keystoreConnecting: boolean;
  public keystoreError: boolean;
  public fileName: string;
  public keystoreErrorMsg: string;

  public showWalletConnect: boolean;
  public showManualInput: boolean;
  public showKeystore: boolean;
  public showManual: boolean;

  constructor(
    public dialogRef: MatDialogRef<DConnectWalletComponent>,
    @Inject(MAT_DIALOG_DATA) public selection: any,
    //private keystoreService: KeystoreService,
    private binanceService: BinanceService
  ) {}

  ngOnInit() {
    this.showWalletConnect = this.selection.showWalletConnect;
    this.showKeystore = this.selection.showKeystore;
    this.showManual = this.selection.showManual;
  }

  async onKeystoreFileChange(event: Event) {
    this.keystoreFileSelected = true;

    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const keystoreFile = files[0];
      this.fileName = keystoreFile.name;

      const reader = new FileReader();

      const onLoadHandler = () => {
        try {
          const key = JSON.parse(reader.result as string);
          if (!('version' in key) || !('crypto' in key)) {
            this.keystoreError = true;
            this.keystoreErrorMsg = 'Not a valid keystore file';
            console.error('not a valid keystore file');
          } else {
            this.keystoreError = false;
            this.keystore = key;
          }
        } catch {
          this.keystoreError = true;
          this.keystoreErrorMsg = 'Not a valid json file';
          console.error('not a valid json file');
        }
      };
      reader.addEventListener('load', onLoadHandler);

      await reader.readAsText(keystoreFile);
    }
  }

  async keystoreUnlockClicked() {
    if (this.fileName && this.fileName.length > 0) {
      if (this.keystorePassword && this.keystorePassword.length > 0) {
        this.keystoreConnecting = true;
        this.keystoreError = false;

        setTimeout(() => {
          this.keystoreUnlock();
        }, 100);
      } else {
        this.keystoreError = true;
        this.keystoreErrorMsg = 'Password is empty';
      }
    } else {
      this.keystoreError = true;
      this.keystoreErrorMsg = 'No file selected';
    }

    if (this.manualWallet.length > 0) {
      const wallet = { type: 'manual', wallet: this.manualWallet };
      this.dialogRef.close(wallet);
    }
  }

  async keystoreUnlock() {
    this.keystoreError = false;

    try {
      // save a copy of keystore on local storage
      localStorage.setItem('dcf_keystore', JSON.stringify(this.keystore));

      const privateKey = getPrivateKeyFromKeyStore(
        this.keystore,
        this.keystorePassword
      );
      await this.binanceService.bncClient.setPrivateKey(privateKey);

      const prefix = this.binanceService.getPrefix();
      const address = getAddressFromPrivateKey(privateKey, prefix);
      const wallet = { type: 'keystore', wallet: address };

      if (address.length > 0) {
        this.dialogRef.close(wallet);
      }

      //TODO: config multichain
      //const user = await this.keystoreService.unlockKeystore(this.keystore, this.keystorePassword);
    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      this.keystoreErrorMsg = 'Invalid password';
      console.error(error);
    }
  }

  walletConnect(selection) {
    this.selection = selection;
    if (this.selection == 'walletconnect') {
      const wallet = { type: 'walletconnect' };
      this.dialogRef.close(wallet);
    } else if (this.selection == 'keystore') {
      this.showKeyStoreForm = true;
    } else {
      this.showManualInput = true;
    }
  }

  back() {
    this.showKeyStoreForm = false;
    this.showManualInput = false;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
