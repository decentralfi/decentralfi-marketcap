import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { CurrencyService } from '../../services/currency.service';
import { GlobalCurrencyService } from '../../services/global-currency.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { NetworkChainService } from '../../../shared/services/network-chain.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { ClipboardService } from 'ngx-clipboard';
import { WalletBalanceService } from '../../../../dex/shared/services/wallet-balance.service';

/* ELEMENTS FROM DEX MODULE */
import { ConnectWalletComponent } from '../../../../dex/shared/dialogs/connect-wallet/connect-wallet.component';
import { WalletData } from '../../../../dex/shared/interfaces/marketcap';

/* Master Wallet Manager */
import { MasterWalletManagerService } from '../../../../../services/master-wallet-manager.service';
import { XDEFIService } from 'src/app/services/xdefi.service';
import { consoleLog } from '@app/utils/consoles';

@Component({
  selector: 'dcf-sidebar-footer',
  templateUrl: './sidebar-footer.component.html',
  styleUrls: ['./sidebar-footer.component.scss'],
})
export class SidebarFooterComponent implements OnInit {
  @Input() mobileFlag: boolean;
  @Output() toggle = new EventEmitter<string>();
  public toggleclass = 'compacted';
  public binanceExplorerUrl: string;
  public bnbAddress = '';
  public bnbAddressMask = '';
  public bnbAccount: any;
  public walletData: any;
  public wallet: string;

  public showWalletConnect: boolean;
  public showManualInput: boolean;
  public showKeystore: boolean;
  public showManual: boolean;

  public themeValue = '';
  public isToggle: boolean;
  public logoFile: string;
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;

  faQuestionCircle = faQuestionCircle;

  public currencyName = 'RUNE';
  public currencyValue = 'RUNE';

  public currencies = [];

  public networks = [
    { label: 'SCCN', value: 'singlechain_chaosnet' },
    { label: 'MCCN', value: 'multichain_chaosnet' },
  ];

  public networkToggle = true;
  public networkLabel = 'MCCN';
  public networkValue = 'multichain_chaosnet';

  public addresses: WalletData[] = [];
  public selectedWallet: string;
  public selectedWalletLabel: string;

  // Create a connector
  public connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  });

  public xdefiConnecting: boolean;
  public xdefiError: boolean;

  public thorAccount;
  public ethAccount;

  constructor(
    private currencyService: GlobalCurrencyService,
    private currenciesService: CurrencyService,
    public dialog: MatDialog,
    private router: Router,
    private chartThemeService: GlobalChartsThemeService,
    private networkChainService: NetworkChainService,
    private _clipboardService: ClipboardService,
    private _snackBar: MatSnackBar,
    private masterWalletManagerService: MasterWalletManagerService,
    private xdefiService: XDEFIService,
    private walletBalanceService: WalletBalanceService
  ) {
    this.binanceExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org/'
        : 'https://explorer.binance.org/';
  }

  ngOnInit() {
    const wallet = localStorage.getItem('wallet');

    if (wallet && wallet.length > 0) {
      this.wallet = wallet;
      this.setWallet(wallet);
    }

    this.masterWalletManagerService.walletData$.subscribe((details) => {
      if (details != null) {
        this.addresses = details;
        consoleLog(this.addresses);
      }
    });

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
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

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      if (theme == 'light-theme') {
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

          const value = data[i].id;
          const element = { label, value };

          this.currencies.push(element);
        }
      });
  }

  setWallet(wallet: string) {
    this.bnbAddress = wallet;
    const addressLenght = this.bnbAddress.length;
    this.bnbAddressMask =
      this.bnbAddress.slice(0, 5) +
      '...' +
      this.bnbAddress.slice(addressLenght - 5, addressLenght);

    //this.walletBalanceService.setWallet(wallet);
    //this.walletBalanceService.getBalance(wallet);
  }

  walletDetails() {
    const url = '/liquidity?wallet=' + this.wallet;
    this.router.navigateByUrl(url);
  }

  connectWalletConnect() {
    if (!this.connector) {
      this.initWalletConnect();
    }

    // Check if connection is already established
    if (!this.connector.connected) {
      // create new session
      this.connector.connect();
      const uri = this.connector.uri;
      // display QR Code modal
      //QRCodeModal.open(uri, () => {});
    } else {
      const uri = this.connector.uri;
      // display QR Code modal
      //QRCodeModal.open(uri, () => {});
    }

    // Subscribe to connection events
    this.connector.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }

      //Get Binance Address
      this.connector
        .sendCustomRequest({
          method: 'get_accounts',
        })
        .then((data) => {
          this.bnbAccount = data.find((account) => account.network === 714);
          this.wallet = this.bnbAccount.address;
          this.setWallet(this.wallet);
          localStorage.setItem('wallet', this.wallet);

          // Close QR Code Modal
          setTimeout(() => {
            QRCodeModal.close();
          }, 500);
        });
    });

    this.connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      //const { accounts, chainId } = payload.params[0];
      consoleLog(payload);
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      this.wallet = null;
      this.bnbAddressMask = null;
      localStorage.removeItem('wallet');
      /*this.bnbAddress = '';
      this.walletBalanceService.setWalletBalance(null);
      this.walletBalanceService.setWallet(null);
      this.walletBalanceService.setWalletData(null);
      delete this.LPTotals;
      this.summary = [];
      this.resume.totalWallet = new BigNumber(0);
      this.historyChartData = [];
      delete this.lineChartOptions;
      this.showData = false;
      this.msg = 'Please connect to a wallet in order to view data.';

      let url = '/dex/liquidity';
      this.router.navigate([url]);*/
    });
  }

  goTo() {
    if (this.mobileFlag == true) {
      this.toggle.emit(this.toggleclass);
    }
  }

  selectCurrency(name: string, id: number) {
    this.currencyName = name;
    this.currencyService.setGlobalCurrency(id);
    this.goTo;
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

    return 'network-toggle mobile ' + toggleClass;
  }

  addWallet() {
    if (this.addresses.length < 10) {
      const showWalletConnect = true;
      const showKeystore = false;
      const showManual = true;
      const showXDefi = true;
      const dialogRef = this.dialog.open(ConnectWalletComponent, {
        autoFocus: false,
        backdropClass: this.dialogBackdropColorClass,
        panelClass: this.dialogPanelClass,
        data: {
          showWalletConnect: showWalletConnect,
          showKeystore: showKeystore,
          showManual: showManual,
          showXDefi: showXDefi,
        },
      });

      dialogRef.afterClosed().subscribe((wallet: WalletData) => {
        this.walletData = wallet;
        if (wallet == undefined) {
          this.selectedWallet = this.addresses[0].address;
        } else {
          if (this.walletData.type && this.walletData.type == 'xdefi') {
            this.connectXDefi(wallet);
          } else if (
            this.walletData.type &&
            this.walletData.type == 'walletconnect'
          ) {
            this.walletConnectOption(wallet);
          } else if (this.walletData.type && this.walletData.type == 'manual') {
            this.setManualWalletData(wallet);
          }
        }
      });
    } else {
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
        const isArray = Array.isArray(user[walletData.chains[i]]);
        if (isArray) {
          this.setXDEFIWalletData(user[walletData.chains[i]][0]);
        } else {
          this.setXDEFIWalletData(user[walletData.chains[i]]);
        }
      }
    } catch (error) {
      this.xdefiError = true;
      console.error(error);
    }
  }

  setXDEFIWalletData(address: string) {
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
}
