import { Component, OnInit, HostBinding, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { WalletData } from '../shared/interfaces/marketcap';
import { ConnectWalletComponent } from '../shared/dialogs/connect-wallet/connect-wallet.component';
import { ForgetWalletComponent } from '../shared/dialogs/forget-wallet/forget-wallet.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClipboardService } from 'ngx-clipboard';
/* Master Wallet Manager */
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';
import { MasterWalletManagerService } from '../../../services/master-wallet-manager.service';
import { MarketcapOperationsComponent } from '@dexShared/dialogs/marketcap-operations/marketcap-operations.component';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { Asset } from '@dexShared/classes/asset';
import { environment } from 'src/environments/environment';
import { consoleLog } from '@app/utils/consoles';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-wallet-manager',
  templateUrl: './wallet-manager.component.html',
  styleUrls: ['./wallet-manager.component.scss'],
})
export class WalletManagerComponent implements OnInit {
  public innerWidth: any;
  public themeValue = '';
  public topBar = 'top-bar open';
  public currencyName = 'USD';
  public walletData: WalletData[] = [];
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;

  public showHideToggle = true;

  public ethereum: any;
  public xfiObject: any;
  public xdeficurrentNetwork: any;

  public bnbAccount: any;
  public thorAccount: any;
  public ethAccount: any;

  // Create a connector for walletconnect
  public connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  });

  @HostBinding('class') componentCssClass: any;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.topBar = 'top-bar open';
    } else if (this.innerWidth <= 450) {
      this.topBar = 'top-bar open';
    }
  }

  public translation: any;
  public language: string;

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private chartThemeService: GlobalChartsThemeService,
    private router: Router,
    private _clipboardService: ClipboardService,
    private masterWalletManagerService: MasterWalletManagerService,
    private operationsService: MarketcapOperationsService,
    public translate: TranslateService
  ) {
    this.componentCssClass = 'full';
  }

  ngOnInit() {
    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      this.themeValue = theme;
      if (this.themeValue == '' || this.themeValue == 'light-theme') {
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
        this.dialogPanelClass = 'wallet-connect-panel-light';
      } else {
        this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
        this.dialogPanelClass = 'wallet-connect-panel-dark';
      }
    });

    this.masterWalletManagerService.currency$.subscribe((currency) => {
      if (currency != null) {
        this.currencyName = currency;

        this.masterWalletManagerService.walletData$.subscribe((walletData) => {
          if (walletData != null) {
            const tempWalletData = walletData;
            this.masterWalletManagerService.originalPools$.subscribe(
              (pools) => {
                if (pools != null) {
                  for (let i = 0; i < tempWalletData.length; i++) {
                    tempWalletData[i].totalBalance =
                      this.masterWalletManagerService.createResumeByWallet(
                        tempWalletData[i],
                        currency
                      );
                  }

                  this.walletData = tempWalletData;
                }
              }
            );
          }
        });
      }
    });

    this.masterWalletManagerService.globalShowHide$.subscribe((value) => {
      if (value != null) {
        this.showHideToggle = value;
      }
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

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('wallet_manager').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  addWallet() {
    if (this.walletData.length < 10) {
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
        if (wallet && wallet.type && wallet.type == 'xdefi') {
          setTimeout(() => {
            this.connectXDefi(wallet);
          }, 100);
        } else if (wallet && wallet.type && wallet.type == 'walletconnect') {
          this.walletConnectOption(wallet);
        } else if (wallet && wallet.type && wallet.type == 'manual') {
          this.masterWalletManagerService.findBalance(
            wallet,
            this.currencyName
          );
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

  deleteWallet(address: string) {
    const forgetDialogRef = this.dialog.open(ForgetWalletComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
    });

    forgetDialogRef.afterClosed().subscribe((data) => {
      let newAddressesLS: WalletData[];
      if (data.yes == true) {
        if (data.type == true) {
          const newAddresses = this.walletData.filter(
            (wallet) => wallet.address !== address
          );
          const walletType = this.walletData.filter(
            (wallet) => wallet.address == address
          )[0].type;
          this.masterWalletManagerService.setWalletData(newAddresses);

          //delete from local storage
          const walletDataFromStorage: WalletData[] = JSON.parse(
            localStorage.getItem('dcf-wallet-data')
          );
          if (walletDataFromStorage != null) {
            newAddressesLS = walletDataFromStorage.filter(
              (wallet) => wallet.address !== address
            );
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify(newAddressesLS)
            );
          }
          if (walletType === 'walletconnect') {
            const moreAddByType = this.walletData.filter(
              (wallet) => wallet.type == walletType
            );
            if (moreAddByType.length == 0) {
              setTimeout(() => {
                this.connector.killSession();
              }, 1000);
            }
          }
          if (walletType === 'keystore') {
            const moreAddByType = this.walletData.filter(
              (wallet) => wallet.type == walletType
            );
            if (moreAddByType.length == 0) {
              localStorage.removeItem('keystore');
              localStorage.removeItem('keystore-file');
            }
          }
        } else {
          const walletType = this.walletData.filter(
            (wallet) => wallet.address == address
          )[0].type;
          consoleLog(walletType);
          if (walletType === 'walletconnect') {
            setTimeout(() => {
              this.connector.killSession();
            }, 1000);
          } else if (walletType === 'keystore') {
            const wallets = JSON.parse(localStorage.getItem('dcf-wallet-data'));

            const newAddressesLS = wallets.filter(
              (wallet: any) => wallet.type != 'keystore'
            );
            localStorage.setItem(
              'dcf-wallet-data',
              JSON.stringify(newAddressesLS)
            );
            this.masterWalletManagerService.setWalletData(newAddressesLS);
            this.masterWalletManagerService.createResume(this.currencyName);
            localStorage.removeItem('keystore');
            localStorage.removeItem('keystore-file');
          } else {
            const newAddresses = this.walletData.filter(
              (wallet) => wallet.type !== walletType
            );
            this.masterWalletManagerService.setWalletData(newAddresses);

            //delete from local storage
            const walletDataFromStorage: WalletData[] = JSON.parse(
              localStorage.getItem('dcf-wallet-data')
            );
            if (walletDataFromStorage != null) {
              newAddressesLS = walletDataFromStorage.filter(
                (wallet) => wallet.type !== walletType
              );
              localStorage.setItem(
                'dcf-wallet-data',
                JSON.stringify(newAddressesLS)
              );
            }
          }
        }
        this.masterWalletManagerService.setWalletData(newAddressesLS);
        this.masterWalletManagerService.createResume(this.currencyName);
        this.operationsService.setWalletRecieve(null);
        this.operationsService.setWalletSend(null);
        this.operationsService.setpoolIn(null);
        this.operationsService.setAssetIn(new Asset('BNB.BNB'));
        this.operationsService.setAssetOut(new Asset('THOR.RUNE'));
      }
    });
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

  goBack() {
    if (window.history.length == 0) {
      this.router.navigate(['/']);
    } else {
      window.history.back();
    }
  }

  connectXDefi(walletData: WalletData) {
    if ('xfi' in window) {
      // Detecting the XDeFi providers: xfi and ethereum
      this.ethereum = (window as any).ethereum;
      this.xfiObject = (window as any).xfi;

      try {
        // Setting current network to bitcoin
        this.xdeficurrentNetwork = (window as any).xfi.bitcoin.network;
      } catch (e) {
        console.error(e);
      }

      try {
        for (let i = 0; i < walletData.chains.length; i++) {
          if (walletData.chains[i] == 'ethereum') {
            if ((window as any).ethereum) {
              consoleLog('eth');
              (window as any).ethereum.request(
                {
                  method: 'eth_requestAccounts',
                  params: [],
                },
                (error: any, accounts: any) => {
                  consoleLog('ethereum accounts', accounts);
                  this.setXDEFIWalletData(accounts[0]);
                }
              );
            } else {
              consoleLog('not eth');
            }
          } else {
            if (
              (window as any).xfi &&
              (window as any).xfi[walletData.chains[i]]
            ) {
              const provider = (window as any).xfi[walletData.chains[i]];
              const method = 'request_accounts';
              provider.request(
                { method: method, params: [] },
                (error: any, accounts: any) => {
                  consoleLog(walletData.chains[i] + ' accounts', accounts);
                  this.setXDEFIWalletData(accounts[0]);
                }
              );

              provider.on('chainChanged', (obj: any) => {
                // Subscription to chain changes
                //consoleLog(`chainChanged::${objects[i]}`, obj);
                // When chain is changed, its respective network is set as current
                this.xdeficurrentNetwork = obj.network || obj._network;
              });
              provider.on('accountsChanged', (obj: any) => {
                // Subscription to account changes
                //consoleLog(`accountsChanged::${objects[i]}`, obj);
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  setXDEFIWalletData(address: string) {
    const walletData = this.masterWalletManagerService.createWalletData(
      address,
      'xdefi'
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
  }

  walletConnectOption(walletData: WalletData) {
    consoleLog(this.connector);

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
      consoleLog(payload);

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
      clientMeta: {
        description: 'WalletConnect Developer App',
        url: 'https://walletconnect.org',
        icons: ['https://walletconnect.org/walletconnect-logo.png'],
        name: 'WalletConnect',
      },
    });
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
  }

  getAssetName(chain: string) {
    let assetName: string;
    if (chain == 'THOR') {
      assetName = 'RUNE';
    } else {
      assetName = chain;
    }
    return assetName;
  }

  getAssetFullName(chain: string) {
    let assetFullName: string;
    if (chain == 'THOR') {
      assetFullName = 'THOR.RUNE';
    } else {
      assetFullName = chain + '.' + chain;
    }
    return assetFullName;
  }

  openSwapModal(
    assetChain: string,
    assetName: string,
    assetFullname: string,
    operationType: string,
    status: string
  ) {
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

    const dialogRef = this.dialog.open(MarketcapOperationsComponent, {
      data: { assetChain, assetName, assetFullname, operationType },
      //maxWidth: '420px',
      //width: '35vw',
      //minWidth: '420px',
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
    });

    dialogRef.afterClosed().subscribe((result) => {
      consoleLog(`Dialog result: ${result}`);
    });
  }

  selectWallet(address: WalletData) {
    this.router.navigate(['/liquidity'], {
      queryParams: { wallet: address.address },
    });
  }
}
