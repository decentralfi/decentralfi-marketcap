import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WalletData } from '../../interfaces/marketcap';
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';
import * as bchRegex from 'bitcoincash-regex';

interface iData {
  chain: string;
  walletRecieve: WalletData;
}

@Component({
  selector: 'app-recieve-wallet',
  templateUrl: './recieve-wallet.component.html',
  styleUrls: ['./recieve-wallet.component.scss'],
})
export class RecieveWalletComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<RecieveWalletComponent>,
    private masterWalletManagerService: MasterWalletManagerService,
    @Inject(MAT_DIALOG_DATA) public data: iData,
    public translate: TranslateService
  ) {}
  public manualWallet: string;
  public addresses: WalletData[] = [];
  public themeValue = localStorage.getItem('dcf-theme');
  public isDisabled = false;

  public innerWidth: any;
  public manual: WalletData = {
    address: 'Manual Input',
    balance: [],
    chain: 'manual',
    explorerURL: 'manual',
    logo: 'manual',
    mask: 'Manual',
    totalBalance: 0,
    type: 'manual',
  };
  public selectedAddress: WalletData = this.manual;
  public addressMask: string = this.manual.address;

  public bitcoinRegex =
    /^(?:[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,33}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/;
  public litecoinRegex =
    /(?:^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}|tltc[a-z0-9]{39,59}|ltc[a-z0-9]{39,59}$)/;
  public ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  public binanceRegex = /^(?:tbnb[a-z0-9]{39,59}|bnb[a-z0-9]{39,59})$/;
  public thorchainRegex = /^(?:thor[a-z0-9]{39,59}|tthor[a-z0-9]{39,59})$/;

  public manualInputError: boolean;
  public manualInputErrorMsg: string;
  public rememberWallet = false;

  public language: string;
  public translation: any;

  ngOnInit() {
    this.innerWidth = window.innerWidth;
    this.masterWalletManagerService.walletData$.subscribe((details) => {
      if (details !== null && details.length > 0) {
        // Asset Selected in the wallet
        const assetWalletByChain = details.filter(
          (wallet) =>
            wallet.chain === this.data.chain && wallet.type !== 'manual'
        );

        this.addresses = assetWalletByChain;
        if (this.data.walletRecieve != null) {
          if (this.data.walletRecieve.type == 'manual') {
            this.manualWallet = this.data.walletRecieve.address;
            this.selectedAddress = this.manual;
            this.addressMask = this.manual.address;
          } else {
            this.selectWallet(this.data.walletRecieve);
          }
        } else {
          this.selectManual();
        }
      }
    });

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  connect() {
    if (this.selectedAddress.type == 'manual') {
      //for manual input validation
      if (this.manualWallet && this.manualWallet.length > 0) {
        const isBitcoin = this.bitcoinRegex.test(this.manualWallet);
        const isEthereum = this.ethereumRegex.test(this.manualWallet);
        const isBCH = bchRegex({ exact: true }).test(this.manualWallet);
        const isLitecoin = this.litecoinRegex.test(this.manualWallet);
        const isBinance = this.binanceRegex.test(this.manualWallet);
        const isThorchain = this.thorchainRegex.test(this.manualWallet);
        let chain = '';
        const mask = this.getMask(this.manualWallet);
        let logo = '';
        this.manualInputError = false;

        this.masterWalletManagerService.walletData$.subscribe((walletData) => {
          if (isBitcoin == true) {
            chain = 'BTC';
            logo =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
          } else if (isEthereum == true) {
            chain = 'ETH';
            logo =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/ETH-1C9/logo.png';
          } else if (isBCH == true) {
            chain = 'BCH';
            logo =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BCH-1FD/logo.png';
          } else if (isLitecoin == true) {
            chain = 'LTC';
            logo =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/LTC-F07/logo.png';
          } else if (isBinance == true) {
            chain = 'BNB';
            logo =
              'https://app.thorswap.finance/static/media/asset-bnb.30ddcde6.svg';
          } else if (isThorchain == true) {
            chain = 'THOR';
            logo =
              'https://app.thorswap.finance/static/media/asset-rune.84d6fe9e.svg';
          } else {
            this.manualInputError = true;
            this.manualInputErrorMsg = 'Not Valid Address';
          }

          if (walletData != null) {
            const duplicate = walletData.filter(
              (data) => data.address == this.manualWallet
            );
            if (duplicate.length > 0) {
              this.manualInputError = true;
              this.manualInputErrorMsg = 'The address already exists';
            }
          }

          if (chain.length > 0 && this.data.chain != chain) {
            this.manualInputError = true;
            this.manualInputErrorMsg =
              'The address must be a ' + this.data.chain + ' address';
          }

          if (this.manualInputError == false) {
            const wallet = {
              type: 'manual',
              address: this.manualWallet,
              chain: chain,
              mask: mask,
              logo: logo,
              remember: this.rememberWallet,
            };
            this.dialogRef.close(wallet);
          }
        });
      }
    } else {
      this.dialogRef.close(this.selectedAddress);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getWalletPanelClass() {
    let panelClass = '';
    if (this.themeValue == 'light-theme') {
      panelClass = 'wallet-select-panel light';
    } else {
      panelClass = 'wallet-select-panel dark';
    }
    return panelClass;
  }

  selectWallet(address: WalletData) {
    this.selectedAddress = address;
    this.addressMask = address.address;
  }

  selectManual() {
    this.selectedAddress = this.manual;
    this.addressMask = this.manual.address;
  }

  getMask(address: string) {
    const addressLenght = address.length;
    const mask =
      address.slice(0, 4) +
      '....' +
      address.slice(addressLenght - 4, addressLenght);

    return mask;
  }
}
