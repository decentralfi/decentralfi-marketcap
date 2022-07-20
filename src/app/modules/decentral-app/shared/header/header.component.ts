import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PendingComponent } from '@dexShared/snackbars/pending/pending.component';
import { CurrencyService } from '../../shared/services/currency.service';
import { GlobalTimePeriodService } from '../../shared/services/global-time-period.service';
import { GlobalCurrencyService } from '../../shared/services/global-currency.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { NetworkChainService } from '../../shared/services/network-chain.service';
import { ClipboardService } from 'ngx-clipboard';
import { WalletBalanceService } from '../../../dex/shared/services/wallet-balance.service';

/* ELEMENTS FROM DEX MODULE */
import { ConnectWalletComponent } from '../../../dex/shared/dialogs/connect-wallet/connect-wallet.component';
import { WalletData } from '../../../dex/shared/interfaces/marketcap';

/* Master Wallet Manager */
import { MasterWalletManagerService } from '../../../../services/master-wallet-manager.service';
import { XDEFIService } from 'src/app/services/xdefi.service';

import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { consoleLog } from '@app/utils/consoles';

@Component({
  selector: 'dcf-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Output() toggle = new EventEmitter<string>();
  @Output() theme = new EventEmitter<string>();

  constructor(
    private currenciesService: CurrencyService,
    private timePeriodService: GlobalTimePeriodService,
    private currencyService: GlobalCurrencyService,
    private chartThemeService: GlobalChartsThemeService,
    private networkChainService: NetworkChainService,
    private router: Router,
    private _snackBar: MatSnackBar,
    public dialog: MatDialog,
    private masterWalletManagerService: MasterWalletManagerService,
    private _clipboardService: ClipboardService,
    private xdefiService: XDEFIService,
    private walletBalanceService: WalletBalanceService
  ) {
    this.today.setDate(this.today.getDate());
  }

  defaultCurrency = new FormControl('RUNE');

  public currencies = [];
  public currencyName = 'RUNE';
  public currencyValue = 'RUNE';
  public perdiodRangeValue = '24H';
  public perdiodRangeLabel: string;
  public perdiodButtonClass = 'period-button';
  public startDate = '';
  public endDate = '';
  public today = new Date();
  public themeValue = '';
  public isToggle: boolean;
  public networkToggle = true;

  public periods = [
    { label: '24H', value: 'last24hr' },
    { label: '7D', value: 'last7day' },
    { label: '1M', value: 'lastMonth' },
    { label: '3M', value: 'last3Month' },
    { label: '6M', value: 'last6Month' },
    //{ label:'YTD', value: 'lastYTD' },
    //{ label:'1Y', value: 'lastYear' },
    //{ label:'MAX', value: 'MAX' }
  ];

  public networkLabel = 'MCCN';
  public networkValue = 'multichain_chaosnet';

  public addresses: WalletData[] = [];
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public selectedWallet: string;
  public selectedWalletLabel: string;
  public walletData: WalletData;

  public xdefiConnecting: boolean;
  public xdefiError: boolean;

  // Create a connector for walletconnect
  public connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  });

  public bnbAccount;
  public thorAccount;
  public ethAccount;

  ngOnInit() {
    this.masterWalletManagerService.walletData$.subscribe((details) => {
      if (details !== null) {
        consoleLog({ details });
        this.addresses = details;
      }
    });

    this.currenciesService
      .getCurrencies(this.networkValue)
      .subscribe((data) => {
        for (let i = 0; i < data.length; i++) {
          const findDot = data[i].name.indexOf('.');
          const findDash = data[i].name.indexOf('-');
          const label =
            findDash == -1
              ? data[i].name.substr(findDot + 1)
              : data[i].name.substr(findDot + 1, findDash - 4);

          const id = data[i].id;
          const price = data[i].price_rune;
          const element = { label, id, price };

          this.currencies.push(element);
        }
      });

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = false;
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = true;
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }
    /* Here is where we subscribe to global time period */
    /* We */
    this.timePeriodService.getGlobalTimePeriod().subscribe((period) => {
      for (let i = 0; i < this.periods.length; i++) {
        if (this.periods[i].value == period) {
          this.perdiodRangeLabel = this.periods[i].label;
        }
      }
    });
    /* */
  }

  setTheme() {
    if (this.themeValue == 'light-theme') {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    } else {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.theme.emit(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }
  }

  selectCurrency(currency) {
    this.currencyName = currency.label;
    this.currencyService.setGlobalCurrency(currency);
  }

  selectNetwork() {
    if (this.networkToggle != true) {
      this.networkValue = 'multichain_chaosnet';
      this.networkLabel = 'MCCN';
    } else {
      this.networkValue = 'singlechain_chaosnet';
      this.networkLabel = 'SCCN';
    }
    this.networkChainService.setGlobalNetwork(this.networkValue);
  }

  getNetworkClass(): string {
    let toggleClass = '';
    if (this.networkToggle == true) {
      toggleClass = 'mccn';
    } else {
      toggleClass = 'sccn';
    }

    return 'network-toggle desktop ' + toggleClass;
  }

  selectPeriod(value: string, label: string) {
    this.perdiodRangeValue = value;
    this.perdiodRangeLabel = label;
    this.timePeriodService.setGlobalTimePeriod(this.perdiodRangeValue);
  }

  getPeriod(value: string, label: string) {
    if (this.endDate != '') {
      this.startDate = '';
      this.endDate = '';
    }

    if (this.perdiodRangeValue != value) {
      this.perdiodRangeValue = value;
      this.perdiodRangeLabel = label;
    } else {
      this.perdiodRangeValue = '1Y';
      this.perdiodRangeLabel = '1Y';
    }
    //set global time period
    this.timePeriodService.setGlobalTimePeriod(this.perdiodRangeValue);
  }

  setColor(label) {
    if (this.perdiodRangeLabel == label) {
      return 'accent';
    } else {
      return 'grey';
    }
  }

  toggleSidebar() {
    const toggle = 'compacted';
    this.toggle.emit(toggle);
  }

  inputEvent(input: string, event) {
    if (input == 'end' && event.value != null) {
      if (this.endDate == '') {
        this.getPeriod('', 'range');
      }
      this.endDate = event.value;
    }
    if (input == 'start') {
      this.startDate = event.value;
    }
  }

  changeEvent(input: string, event) {
    if (input == 'end' && event.value != null) {
      this.getPeriod('', 'range');
    }
  }

  logout() {
    this.router.navigate(['/']);
    /*let user = JSON.parse(localStorage.getItem('dcf-user'));
    consoleLog(user);
    this.userService.logout(user.token).subscribe(response =>{
      consoleLog(response);
      if(this.mobileFlag == true){
        this.toggle.emit(this.toggleclass);
      }
      localStorage.removeItem('dcf-user');
      this.router.navigate(['/app/login']);
    });*/
  }

  addWallet() {
    if (this.addresses && this.addresses.length < 10) {
      const showWalletConnect = false;
      const showKeystore = true;
      const showKeystoreFilecreate = true;
      const showKeystorePhrasecreate = true;
      const showManual = true;
      const showXDefi = true;
      const dialogRef = this.dialog.open(ConnectWalletComponent, {
        autoFocus: false,
        backdropClass: this.dialogBackdropColorClass,
        panelClass: this.dialogPanelClass,
        data: {
          showWalletConnect: showWalletConnect,
          showKeystore: showKeystore,
          showKeystoreFilecreate: showKeystoreFilecreate,
          showKeystorePhrasecreate: showKeystorePhrasecreate,
          showManual: showManual,
          showXDefi: showXDefi,
        },
      });

      dialogRef.afterClosed().subscribe((wallet: WalletData) => {
        this.walletData = wallet;
        if (wallet === undefined) {
          this.selectedWallet = this.addresses[0]?.address;
        } else {
          if (this.walletData.type && this.walletData.type === 'xdefi') {
            consoleLog({ wallet });
            this.connectXDefi(wallet);
          } else if (
            this.walletData.type &&
            this.walletData.type === 'walletconnect'
          ) {
            this.walletConnectOption(wallet);
          } else if (
            this.walletData.type &&
            this.walletData.type === 'manual'
          ) {
            this.setManualWalletData(wallet);
          }
        }
      });
    } else if (this.addresses && this.addresses.length >= 10) {
      this._snackBar.open('You can add up to 10 wallets', '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
  }

  async connectXDefi(walletData: WalletData) {
    this.xdefiError = false;
    this.xdefiConnecting = true;
    try {
      const user = await this.xdefiService.connectXDEFI();

      for (let i = 0; i < walletData.chains.length; i++) {
        const isArray = Array.isArray(user.addresses[walletData.chains[i]]);
        if (isArray) {
          this.setXDEFIWalletData(user.addresses[walletData.chains[i]][0]);
        } else {
          this.setXDEFIWalletData(user.addresses[walletData.chains[i]]);
        }
      }
    } catch (error) {
      this.xdefiError = true;
      console.error(error);
    }
  }

  setXDEFIWalletData(address: string) {
    consoleLog({ address });
    this.walletBalanceService.setWalletData(this.addresses);
    const walletData = this.masterWalletManagerService.createWalletData(
      address,
      'xdefi'
    );

    this.masterWalletManagerService
      .findBalance(walletData, this.currencyName)
      .then(
        (data) => {
          //consoleLog(data);
          //remember wallet
          const walletDataFromStorage: WalletData[] = JSON.parse(
            localStorage.getItem('dcf-wallet-data')
          );

          // consoleLog({
          //   walletData,
          //   currencyName: this.currencyName,
          //   data,
          //   walletDataFromStorage,
          // });

          if (walletDataFromStorage === null) {
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify([walletData])
            );
          } else {
            walletDataFromStorage.push(walletData);
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify(walletDataFromStorage)
            );
          }
        },
        (error) => {
          consoleLog(error);
        }
      );
    /*this.selectedWallet = walletData.address;
    this.selectedWalletLabel = walletData.mask;*/
  }

  walletConnectOption(walletData: WalletData) {
    if (!this.connector) {
      this.initWalletConnect();
    }

    // Check if connection is already established
    if (!this.connector.connected) {
      // create new session
      this.connector.createSession();
    } else {
      this.connector
        .sendCustomRequest({
          method: 'get_accounts',
        })
        .then((data) => {
          consoleLog('get_accounts', data, walletData.chains);

          for (let i = 0; i < walletData.chains.length; i++) {
            if (walletData.chains[i] == 'binance') {
              this.bnbAccount = data.find((account) => account.network === 714);
              this.setWalletConnetWalletData(this.bnbAccount.address);
            }
            if (walletData.chains[i] == 'ethereum') {
              this.ethAccount = data.find((account) => account.network === 60);
              this.setWalletConnetWalletData(this.ethAccount.address);
            }
            if (walletData.chains[i] == 'thorchain') {
              this.thorAccount = data.find(
                (account) => account.network === 931
              );
              this.setWalletConnetWalletData(this.thorAccount.address);
            }
          }
        });
    }

    // Subscribe to connection events
    this.connector.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get provided accounts and chainId
      const { accounts, chainId } = payload.params[0];
      consoleLog(payload);

      this.connector
        .sendCustomRequest({
          method: 'get_accounts',
        })
        .then((data) => {
          consoleLog('get_accounts', data, walletData.chains);

          for (let i = 0; i < walletData.chains.length; i++) {
            if (walletData.chains[i] == 'binance') {
              this.bnbAccount = data.find((account) => account.network === 714);
              this.setWalletConnetWalletData(this.bnbAccount.address);
            }
            if (walletData.chains[i] == 'ethereum') {
              this.ethAccount = data.find((account) => account.network === 60);
              this.setWalletConnetWalletData(this.ethAccount.address);
            }
            if (walletData.chains[i] == 'thorchain') {
              this.thorAccount = data.find(
                (account) => account.network === 931
              );
              this.setWalletConnetWalletData(this.thorAccount.address);
            }
          }
        });
    });
  }

  initWalletConnect() {
    // Create a connector
    this.connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal,
    });
  }

  setManualWalletData(wallet: WalletData) {
    this.walletBalanceService.setWalletData(this.addresses);
    this.masterWalletManagerService.findBalance(wallet, this.currencyName).then(
      (walletData) => {
        consoleLog(walletData);
        //remember wallet
        if (wallet.remember == true) {
          const walletDataFromStorage: WalletData[] = JSON.parse(
            localStorage.getItem('dcf-wallet-data')
          );
          if (walletDataFromStorage == null) {
            localStorage.setItem('dcf-wallet-data', JSON.stringify([wallet]));
          } else {
            walletDataFromStorage.push(wallet);
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify(walletDataFromStorage)
            );
          }
        }
      },
      (error) => {
        consoleLog(error);
      }
    );
    this.selectedWallet = wallet.address;
    this.selectedWalletLabel = wallet.mask;
  }

  setWalletConnetWalletData(address: string) {
    const walletData = this.masterWalletManagerService.createWalletData(
      address,
      'walletconnect'
    );
    this.masterWalletManagerService
      .findBalance(walletData, this.currencyName)
      .then(
        (data) => {
          consoleLog(data);
          //remember wallet
          const walletDataFromStorage: WalletData[] = JSON.parse(
            localStorage.getItem('dcf-wallet-data')
          );
          if (walletDataFromStorage == null) {
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify([walletData])
            );
          } else {
            walletDataFromStorage.push(walletData);
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify(walletDataFromStorage)
            );
          }
        },
        (error) => {
          consoleLog(error);
        }
      );
    //this.selectedWallet = walletData.address;
    //this.selectedWalletLabel = walletData.mask;
  }

  editWallet() {
    this.router.navigate(['/wallet']);
  }

  selectWallet(address: WalletData) {
    this.selectedWallet = address.address;
    this.selectedWalletLabel = this.getMask(address.address);
    this.router.navigate(['/liquidity'], {
      queryParams: { wallet: address.address },
    });
    //window.open(address.explorerURL, '_blank').focus();
  }

  getMask(address: string) {
    const addressLenght = address.length;
    const mask =
      address.slice(0, 8) +
      '....' +
      address.slice(addressLenght - 8, addressLenght);

    return mask;
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

  copy(address: string) {
    this._clipboardService.copy(address);
    this._snackBar.open('Wallet address copied to Clipboard!', '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  launch(wallet: WalletData) {
    window.open(wallet.explorerURL, '_blank').focus();
  }

  openPending() {
    this._snackBar.openFromComponent(PendingComponent, {
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [this.themeValue, 'pending-container'],
      announcementMessage: 'No transactions found',
    });
  }

  getSimbol(title?: boolean) {
    if (this.currencyName == 'RUNE') {
      return 'ᚱ';
    } else if (this.currencyName == 'USD') {
      return '$';
    } else {
      if (title) {
        return '$';
      } else {
        return '';
      }
    }
  }
}
