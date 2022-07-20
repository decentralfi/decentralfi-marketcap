import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PendingComponent } from '@dexShared/snackbars/pending/pending.component';
import { MatDialog } from '@angular/material/dialog';

import { ClipboardService } from 'ngx-clipboard';
import { environment } from 'src/environments/environment';

// WALLET
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

// SERVICES
/* Master Wallet Manager */
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { XDEFIService } from '@services/xdefi.service';
import { GlobalChartsThemeService } from '@services/global-charts-theme.service';
import { WalletBalanceService } from '@dexShared/services/wallet-balance.service';
import { UserService } from '@dexShared/services/user.service';

// DIALOGS
import { ForgetWalletComponent } from '@dexShared/dialogs/forget-wallet/forget-wallet.component';
import { ConnectWalletComponent } from '@dexShared/dialogs/connect-wallet/connect-wallet.component';

// INTERFACES
import { WalletData, addressesTypes } from '@dexShared/interfaces/marketcap';
import { Asset } from '../../classes/asset';
import { consoleLog } from '@app/utils/consoles';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dcf-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  public dcf_network = environment.network;
  public dcf_networkPath =
    environment.defaultThorVersion + '_' + environment.network;
  public logoFile = 'decentralfi-logo.svg';
  public midgardStatus: boolean;
  public thornodeStatus: boolean;
  public statusValue = 'MIDGARD API';
  public statuses = [
    {
      label: 'MIDGARD API',
      chain: null,
      value: 'midgard.ninerealms.com',
      status: false,
    },
    {
      label: 'THORNODE',
      chain: null,
      value: 'thornode.ninerealms.com',
      status: false,
    },
    { label: 'BITCOIN CHAIN', chain: 'BTC', value: 'Halted', status: false },
    { label: 'BINANCE CHAIN', chain: 'BNB', value: 'Halted', status: false },
    { label: 'LITECOIN CHAIN', chain: 'LTC', value: 'Halted', status: false },
    { label: 'ETHEREUM CHAIN', chain: 'ETH', value: 'Halted', status: false },
    {
      label: 'BITCOIN CASH CHAIN',
      chain: 'BCH',
      value: 'Halted',
      status: true,
    },
    { label: 'DOGECOIN CHAIN', chain: 'DOGE', value: 'Halted', status: false },
  ];
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public addresses: WalletData[] = [];
  public bnbAddress: WalletData[] = [];
  public bnbAddressMask: string;
  public currencyValue = 'USD';
  public currencyName = 'USD';
  public currencies = [
    { label: 'RUNE', value: 'RUNE' },
    { label: 'USD', value: 'USD' },
    //{label:'ASSET', value: 'ASSET'},
  ];
  public isToggle: boolean;
  public themeValue = '';
  public walletData: any;

  public asset: string;
  public assetLabel: string;
  public selectedWallet: string;
  public selectedWalletLabel: string;

  public bnbAccount: any;
  public thorAccount: any;
  public ethAccount: any;

  public isBNB = false;
  public networkToggle = true;
  public showHideToggle = true;
  public networkLabel: string = environment.network.toLocaleUpperCase();
  public networkValue: string =
    environment.defaultThorVersion + '_' + environment.network;
  public networks = [
    { label: 'CHAOSNET', value: 'multichain_chaosnet' },
    { label: 'TESTNET', value: 'multichain_testnet' },
  ];
  public ethereum: any;
  public xfiObject: any;
  public xdeficurrentNetwork: any;

  public xdefiConnecting: boolean;
  public xdefiError: boolean;

  public subs: Subscription[] = [];

  // Create a connector for walletconnect
  public connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  });

  public languages = ['EN', 'ES'];
  public language: string;
  public translation: any;
  public langPanelClass: string;

  constructor(
    private router: Router,
    private walletBalanceService: WalletBalanceService,
    public dialog: MatDialog,
    private chartThemeService: GlobalChartsThemeService,
    private activeRoute: ActivatedRoute,
    private _snackBar: MatSnackBar,
    private _clipboardService: ClipboardService,
    private masterWalletManagerService: MasterWalletManagerService,
    private xdefiService: XDEFIService,
    private userService: UserService,
    public translate: TranslateService
  ) {}

  ngOnInit() {
    const activeRouteSub = this.activeRoute.queryParams.subscribe((params) => {
      this.masterWalletManagerService.getOriginalPools().subscribe((pools) => {
        if (pools !== null) {
          this.masterWalletManagerService.walletData$.subscribe((details) => {
            if (details && details !== null) {
              if (params['wallet']) {
                const walletExist = details.filter(
                  (wallet) => wallet.address === params['wallet']
                );
                if (walletExist.length !== 0) {
                  this.selectedWalletLabel = walletExist[0].mask;
                  if (walletExist[0].chain === 'BNB') {
                    this.isBNB = true;
                  } else {
                    this.isBNB = false;
                  }
                }
              }

              this.addresses = details;
            } else {
              if (params['wallet']) {
                const walletData =
                  this.masterWalletManagerService.createWalletData(
                    params['wallet'],
                    'manual'
                  );

                if (
                  environment.network == 'testnet' &&
                  (walletData.chain == 'BTC' ||
                    walletData.chain == 'DOGE' ||
                    walletData.chain == 'ETH' ||
                    walletData.chain == 'LTC')
                ) {
                  this.masterWalletManagerService
                    .getBalanceFromXchain(walletData, 'USD')
                    .then((data) => {
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
                    });
                } else {
                  this.masterWalletManagerService.findBalance(
                    walletData,
                    this.currencyName
                  );
                }

                if (walletData.chain == 'BNB') {
                  this.isBNB = true;
                } else {
                  this.isBNB = false;
                }
              }
            }
          });
        }
      });
    });

    this.activeRoute.queryParams.subscribe((wallet) => {
      if (wallet['wallet']) {
        this.currencies = [
          { label: 'RUNE', value: 'RUNE' },
          { label: 'USD', value: 'USD' },
          { label: 'ASSET', value: 'ASSET' },
        ];
      } else {
        if (this.currencyValue == 'ASSET') {
          this.currencyValue = 'USD';
          this.currencyName = 'USD';
        }
        this.currencies = [
          { label: 'RUNE', value: 'RUNE' },
          { label: 'USD', value: 'USD' },
        ];
      }
    });

    this.masterWalletManagerService.getThornodeHeatlh().subscribe((health) => {
      const index = this.statuses.findIndex((status) =>
        status.label.includes('THORNODE')
      );
      health && health.ping == 'pong'
        ? (this.statuses[index].status = true)
        : (this.statuses[index].status = false);
    });

    this.masterWalletManagerService.getHeatlh().subscribe((health) => {
      const index = this.statuses.findIndex((status) =>
        status.label.includes('MIDGARD')
      );
      if (health && health.database) {
        this.statuses[index].status = health.database;
      }
    });

    this.masterWalletManagerService
      .getInboundAddresses()
      .subscribe((inboundAddress) => {
        for (let i = 0; i < this.statuses.length; i++) {
          if (this.statuses[i].chain != null) {
            const haltFilter = inboundAddress.filter(
              (address) => address.chain == this.statuses[i].chain
            );
            if (haltFilter.length > 0) {
              const halted = haltFilter[0].halted;
              this.statuses[i].status = !halted;
              this.statuses[i].status == true
                ? (this.statuses[i].value = 'Active')
                : (this.statuses[i].value = 'Halted');
            }
          }
        }
      });

    this.masterWalletManagerService.midgardStatus$.subscribe((status) =>
      status != null ? (this.midgardStatus = status) : null
    );

    if (this.activeRoute.snapshot.params.asset) {
      const assetName = new Asset(this.activeRoute.snapshot.params.asset);
      this.asset = this.activeRoute.snapshot.params['asset'];
      this.assetLabel = '/Pool/' + assetName.chain + '.' + assetName.ticker;
      consoleLog(this.asset);
    }

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      this.themeValue = theme;

      if (this.themeValue === null || this.themeValue === 'light-theme') {
        this.themeValue = 'light-theme';
        localStorage.setItem('dcf-theme', this.themeValue);
        this.isToggle = false;
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
        this.dialogPanelClass = 'wallet-connect-panel-light';
        this.langPanelClass = 'lang-select-panel-light';
      } else {
        this.themeValue = 'dark-theme';
        localStorage.setItem('dcf-theme', this.themeValue);
        this.isToggle = true;
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
        this.dialogPanelClass = 'wallet-connect-panel-dark';
        this.langPanelClass = 'lang-select-panel-dark';
      }
    });

    this.walletBalanceService.walletData$.subscribe((wallet) => {
      if (wallet != null) {
        //this.setWallet(wallet.wallet);
      } else {
        this.bnbAddress = [];
        this.bnbAddressMask = '';
      }
    });

    this.masterWalletManagerService.globalNetwork$.subscribe((net) => {
      if (net != 'MCCN') {
        this.networkToggle = false;
      } else {
        this.networkToggle = true;
      }
    });

    //walletconnect events subscription
    this.connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      const { accounts, chainId } = payload.params[0];
      consoleLog('session_update');
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      const wallets = JSON.parse(localStorage.getItem('dcf-wallet-data'));

      const newAddressesLS = wallets.filter(
        (wallet: any) => wallet.type != 'walletconnect'
      );
      localStorage.setItem('dcf-wallet-data', JSON.stringify(newAddressesLS));
      this.masterWalletManagerService.setWalletData(newAddressesLS);
      this.masterWalletManagerService.createResume(this.currencyName);

      // Delete connector
    });

    this.subs.push(activeRouteSub);

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('header').subscribe((res: string) => {
        this.translation = res;
        this.translateStatuses(res);
      });
    });
  }

  translateStatuses(translation) {
    for (let i = 0; i < this.statuses.length; i++) {
      if (this.statuses[i].chain != null) {
        this.statuses[i].label =
          translation.statuses.labels[this.statuses[i].chain];
        const value = this.statuses[i].status == true ? 'active' : 'halted';
        this.statuses[i].value =
          translation.statuses.status[value.toLowerCase()];
      }
    }
  }

  setLang(lang: string) {
    this.masterWalletManagerService.setLanguage(lang.toLowerCase());
  }

  goToDashboard() {
    this.router.navigate(['app']);
  }

  getOverallHealthStatus() {
    const everyStatus = this.statuses.every((status) => status.status == true);
    const someStatus = this.statuses.some((status) => status.status == false);

    if (everyStatus == true) {
      return 'status-dot green';
    }

    if (someStatus == true) {
      return 'status-dot yellow';
    }

    if (everyStatus == false) {
      return 'status-dot red';
    }
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
          this.selectedWallet =
            this.addresses.length > 0 ? this.addresses[0].address : null;
        } else {
          if (this.walletData.type && this.walletData.type === 'xdefi') {
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

  walletConnectOption(walletData: WalletData) {
    consoleLog('walletConnectOption', this.connector);
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
              this.bnbAccount = data.find(
                (account: any) => account.network === 714
              );
              this.setWalletConnetWalletData(this.bnbAccount.address);
            }
            if (walletData.chains[i] == 'ethereum') {
              this.ethAccount = data.find(
                (account: any) => account.network === 60
              );
              this.setWalletConnetWalletData(this.ethAccount.address);
            }
            if (walletData.chains[i] == 'thorchain') {
              this.thorAccount = data.find(
                (account: any) => account.network === 931
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

      this.connector
        .sendCustomRequest({
          method: 'get_accounts',
        })
        .then((data) => {
          consoleLog(data);
          for (let i = 0; i < walletData.chains.length; i++) {
            if (walletData.chains[i] == 'binance') {
              this.bnbAccount = data.find(
                (account: any) => account.network === 714
              );
              this.setWalletConnetWalletData(this.bnbAccount.address);
            }
            if (walletData.chains[i] == 'ethereum') {
              this.ethAccount = data.find(
                (account: any) => account.network === 60
              );
              this.setWalletConnetWalletData(this.ethAccount.address);
            }
            if (walletData.chains[i] == 'thorchain') {
              this.thorAccount = data.find(
                (account: any) => account.network === 931
              );
              this.setWalletConnetWalletData(this.thorAccount.address);
            }
          }
        });
    });

    this.connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      const { accounts, chainId } = payload.params[0];
      consoleLog('session_update');
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      const wallets = JSON.parse(localStorage.getItem('dcf-wallet-data'));

      const newAddressesLS = wallets.filter(
        (wallet: any) => wallet.type != 'walletconnect'
      );
      localStorage.setItem('dcf-wallet-data', JSON.stringify(newAddressesLS));
      this.masterWalletManagerService.setWalletData(newAddressesLS);
      this.masterWalletManagerService.createResume(this.currencyName);

      // Delete connector
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
    consoleLog('setManualWalletData');
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

  async connectXDefi(walletData: WalletData) {
    this.xdefiError = false;
    this.xdefiConnecting = true;
    try {
      const { newUser, addresses } = await this.xdefiService.connectXDEFI();
      consoleLog('xdefiConnect::got user');

      this.userService.setUser(newUser);
      localStorage.setItem('XDEFI_CONNECTED', 'true');

      for (let i = 0; i < walletData.chains.length; i++) {
        const walletType: addressesTypes = walletData.chains[i];
        const isArray = Array.isArray(addresses[walletType]);
        if (isArray) {
          this.setXDEFIWalletData(addresses[walletData.chains[i]][0]);
        } else {
          this.setXDEFIWalletData(addresses[walletData.chains[i]]);
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

    consoleLog('setXDEFIWalletData');
    if (
      environment.network == 'testnet' &&
      (walletData.chain == 'BTC' ||
        walletData.chain == 'DOGE' ||
        walletData.chain == 'ETH' ||
        walletData.chain == 'LTC')
    ) {
      this.masterWalletManagerService
        .getBalanceFromXchain(walletData, 'USD')
        .then((data) => {
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
        });
    } else {
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
    }
    /*this.selectedWallet = walletData.address;
    this.selectedWalletLabel = walletData.mask;*/
  }

  setWalletConnetWalletData(address: string) {
    const walletData = this.masterWalletManagerService.createWalletData(
      address,
      'walletconnect'
    );
    consoleLog('setWalletConnetWalletData');
    this.masterWalletManagerService
      .findBalance(walletData, this.currencyName)
      .then(
        (data) => {
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

  walletDetails() {
    //window.open(this.binanceExplorerUrl + 'address/' + this.bnbAddress, "_blank");
    //window.open('liquidity?wallet=' + this.bnbAddress, "_blank");
    window.open('liquidity?wallet=' + this.bnbAddress, '_self');
  }

  forgetWallet() {
    const forgetDialogRef = this.dialog.open(ForgetWalletComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
    });

    forgetDialogRef.afterClosed().subscribe((data) => {
      if (data.yes === true) {
        /*if(this.walletData.type == 'walletconnect'){
          //this.connector.killSession();
        }else if(this.walletData.type == 'keystore'){
          localStorage.removeItem('dcf_keystore');
        }*/
        localStorage.removeItem('dcf-wallet-data');
        this.userService.setUser(null);

        this.bnbAddress = [];
        this.bnbAddressMask = '';
        this.walletBalanceService.setWallet(null);
        this.walletBalanceService.setWalletData(null);

        //let url = '/dex/liquidity';
        // window.location.replace(url);
        window.location.reload();
      }
    });
  }

  selectCurrency(label: string, value: any) {
    this.currencyName = label;
    this.masterWalletManagerService.setCurrency(label);
    this.masterWalletManagerService.createResume(this.currencyName);
  }

  setWallet(wallet: string) {
    //this.addresses.push(wallet);
    const addressLenght = this.bnbAddress.length;
    this.bnbAddressMask =
      this.bnbAddress.slice(0, 8) +
      '....' +
      this.bnbAddress.slice(addressLenght - 8, addressLenght);

    consoleLog(this.bnbAddress);
  }

  setTheme() {
    if (this.themeValue === 'light-theme') {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.isToggle = false;
    } else {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.isToggle = true;
    }
  }

  selectWallet(address: WalletData) {
    this.selectedWallet = address.address;
    this.selectedWalletLabel = this.getMask(address.address);
    this.router.navigate(['/liquidity'], {
      queryParams: { wallet: address.address },
    });
  }

  getAddress() {
    return this.addresses[0].address;
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

  getMask(address: string) {
    const addressLenght = address.length;
    const mask =
      address.slice(0, 8) +
      '....' +
      address.slice(addressLenght - 8, addressLenght);

    return mask;
  }

  logout() {
    this.router.navigate(['/']);
  }

  editWallet() {
    this.router.navigate(['/wallet']);
  }

  copy(address: string) {
    this._clipboardService.copy(address);
    this._snackBar.open(this.translation.copy_msg, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  launch(wallet: WalletData) {
    window.open(wallet.explorerURL, '_blank').focus();
  }

  selectNetwork(label: string, value: string) {
    this.networkLabel = label;
    localStorage.setItem('dcf-network', value);
    location.reload();
  }

  selectShowHide() {
    let toggle = true;
    if (this.showHideToggle == true) {
      toggle = false;
    } else {
      toggle = true;
    }
    this.masterWalletManagerService.setGlobalShowHide(toggle);
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

  getShowHideClass(): string {
    let toggleClass = '';
    if (this.showHideToggle == true) {
      toggleClass = 'show-amount';
    } else {
      toggleClass = 'hide-amount';
    }

    return 'show-hide-toggle desktop ' + toggleClass;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
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
