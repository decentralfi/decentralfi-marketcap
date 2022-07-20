import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';
import {
  MidgardPool,
  WalletData,
  WalletBalance,
  addressesTypes,
} from '../../interfaces/marketcap';

import { environment } from 'src/environments/environment';

import { MarketPool } from '@dexShared/interfaces/marketcap';
import { Asset } from '@dexShared/classes/asset';
import { User, WalletType } from '@dexShared/classes/user';

import { UserService } from '@dexShared/services/user.service';
import { XDEFIService } from 'src/app/services/xdefi.service';
import { consoleLog } from '@app/utils/consoles';

import { TranslateService } from '@ngx-translate/core';

interface iData {
  assetChain: string;
  assetName: string;
  assetFullname: string;
  operationType: string;
}

@Component({
  selector: 'app-marketcap-operations',
  templateUrl: './marketcap-operations.component.html',
  styleUrls: ['./marketcap-operations.component.scss'],
})
export class MarketcapOperationsComponent implements OnInit, OnDestroy {
  public net = localStorage.getItem('dcf-network');
  public isProd = environment.production;
  public themeValue = '';
  private details: WalletData[];
  public currencyName = 'USD';
  public balance = 0;
  public poolList: MarketPool[] = [];

  public addresses: WalletData[] = [];
  public selectedAddress: WalletData;

  public walletReceiveAsset: WalletData;
  public walletReceiveAssetType: string;
  public walletSendAsset: WalletData;
  public walletType: WalletType;

  public isDisabled = false;

  public assetSelected: MarketPool;

  public user: User[];
  public subs: Subscription[] = [];
  public user$: Subscription;

  public innerWidth: any;
  public addressMask: string;
  public assetIn: Asset;
  public assetOut: Asset;

  public language: string;
  public translation: any;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.innerWidth = window.innerWidth;
    // if (this.innerWidth > 960) {
    // } else if (this.innerWidth > 450 && this.innerWidth <= 960) {
    // } else if (this.innerWidth <= 450) {
    // }

    if (this.selectedAddress) {
      this.getSelectedAddress();
    }
  }

  constructor(
    public dialogRef: MatDialogRef<MarketcapOperationsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: iData,
    private masterWalletManagerService: MasterWalletManagerService,
    private operationsService: MarketcapOperationsService,
    private userService: UserService,
    private xdefiService: XDEFIService,
    public translate: TranslateService
  ) {
    const user$ = this.userService.user$.subscribe(async (user) => {
      this.user = user;
    });
    this.subs = [
      user$,
      // slippageTolerange$
    ];

    const operationType = this.data.operationType;
    if (this.data.assetName === 'RUNE') {
      // if (this.data.operationType === 'swap') {
      // } else
      if (this.data.operationType === 'add') {
        this.data = {
          assetChain: 'BNB',
          assetFullname: 'BNB.BNB',
          assetName: 'BNB',
          operationType: operationType,
        };
      } //else if (this.data.operationType === 'withdraw') {
      // } else if (this.data.operationType === 'send') {
      // }
    }
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;

    this.masterWalletManagerService.currency$.subscribe((currency) => {
      if (currency !== null) {
        this.currencyName = currency;

        // TO GET ALL POOL
        this.masterWalletManagerService.originalPools$.subscribe(
          (pools: MidgardPool[]) => {
            if (pools !== null) {
              this.masterWalletManagerService.originalPriceChange$.subscribe(
                (depthPriceHistory) => {
                  if (depthPriceHistory !== null) {
                    const marketPools =
                      this.masterWalletManagerService.createPoolList(
                        pools,
                        depthPriceHistory,
                        this.currencyName
                      );
                    this.poolList = marketPools;
                    this.assetSelected = marketPools.filter(
                      (pools) => pools.name === this.data.assetName
                    )[0];

                    this.operationsService.setpoolIn(this.assetSelected);
                  }
                }
              );
            }
          }
        );
      }
    });
    // ADDRESS
    this.masterWalletManagerService.walletData$.subscribe((details) => {
      if (details !== null && details.length > 0) {
        if (details.some((wallet) => wallet.type === 'xdefi')) {
          const xdefiFilter: string[] = details
            .filter((wallet) => wallet.type == 'xdefi')
            .map((value) => value.chain);
          const walletTypes: addressesTypes[] =
            this.getWalletTypes(xdefiFilter);
          const xdefiMap = xdefiFilter.map((chain) => chain);

          this.connectXDEFI(walletTypes);
        }
        this.details = details;

        this.walletType = details[0].type as WalletType;

        // Asset Selected in the wallet
        const assetWalletByChain = details.filter(
          (wallet) =>
            //wallet.chain === this.data.assetChain
            wallet.chain === this.data.assetChain && wallet.type !== 'manual' //TODO activate txs with walletconnect
          //wallet.chain === this.data.assetChain && wallet.type === 'xdefi'
        );

        if (assetWalletByChain.length > 0) {
          this.addresses = assetWalletByChain;
          this.selectedAddress = assetWalletByChain[0];
          this.getSelectedAddress();
          this.selectWallet(assetWalletByChain[0]);

          const balanceByAsset = !this.selectedAddress.balance[0].details
            ? this.selectedAddress.balance.filter(({ asset }) =>
                asset.startsWith(
                  this.data.assetName === 'RUNE' ? 'rune' : this.data.assetName
                )
              )
            : [{ asset: this.data.assetName, amount: 0 }];

          const updateBalanceByAsset = balanceByAsset;

          this.walletSendAsset = {
            ...this.selectedAddress,
            balance: updateBalanceByAsset,
          };

          if (this.data.assetName !== 'RUNE') {
            // ThorChain in the wallet
            const thorWalletDetails = details.filter(
              ({ chain }) => chain === 'THOR'
            );

            if (thorWalletDetails.length > 0) {
              const balanceByRune = thorWalletDetails[0].balance.filter(
                ({ asset }) => asset === 'rune'
              );

              this.walletReceiveAsset = {
                ...thorWalletDetails[0],
                balance: balanceByRune,
              };

              this.operationsService.setWalletSend(this.walletSendAsset);
              this.operationsService.setWalletRecieve(this.walletReceiveAsset);
              this.operationsService.setAssetIn(
                new Asset(`${this.data.assetFullname}`)
              );
              consoleLog(this.data.assetFullname);
              this.operationsService.setAssetOut(new Asset('THOR.RUNE'));
            }
          } else {
            // BNB in the wallet
            const BNBWalletDetails = details.filter(
              ({ chain }) => chain === 'BNB'
            );

            if (BNBWalletDetails.length > 0) {
              const balanceByBNB = BNBWalletDetails[0].balance.filter(
                ({ asset }) => asset === 'BNB.BNB'
              );

              this.walletReceiveAsset = {
                ...BNBWalletDetails[0],
                balance: balanceByBNB,
              };
              this.operationsService.setWalletSend(this.walletSendAsset);
              this.operationsService.setWalletRecieve(this.walletReceiveAsset);
              this.operationsService.setAssetIn(
                new Asset(`${this.data.assetFullname}`)
              );
              consoleLog(this.data.assetFullname);
              this.operationsService.setAssetOut(new Asset('BNB.BNB'));
            }
          }
        } else {
          this.operationsService.setAssetIn(new Asset(this.data.assetFullname));
        }
      } else {
        this.operationsService.setAssetIn(new Asset(this.data.assetFullname));
      }
    });

    ///////////////
    this.operationsService.walletSend$.subscribe((walletSend) => {
      if (walletSend !== null) {
        this.walletSendAsset = walletSend;
        this.selectedAddress = walletSend;
        this.getSelectedAddress();
      }
    });
    // this.operationsService.walletRecieve$.subscribe((walletRecieve) => {
    //   this.walletReceiveAsset = walletRecieve;
    // });
    this.operationsService.walletRecieveType$.subscribe((walletRecieveType) => {
      this.walletReceiveAssetType = walletRecieveType;
    });
    this.operationsService.assetIn$.subscribe((assetIn) => {
      // Asset Selected in the wallet
      const assetWalletByChain = this.details
        ? this.details.filter(
            (wallet) =>
              wallet.chain === assetIn.chain && wallet.type !== 'manual'
          )
        : [];

      if (assetWalletByChain.length > 0) {
        this.addresses = assetWalletByChain;
        this.selectedAddress = assetWalletByChain.filter(
          (wallet) => wallet.type == this.walletType
        )[0];
        this.getSelectedAddress();

        this.operationsService.setWalletSend(this.selectedAddress);
      }
    });

    this.operationsService.assetOut$.subscribe((assetOut) => {
      this.assetOut = assetOut;
      const assetWalletByChain = this.details
        ? this.details.filter(
            (wallet) =>
              wallet.chain === assetOut.chain && wallet.type !== 'manual'
          )
        : [];

      if (assetWalletByChain.length > 0) {
        if (this.walletReceiveAssetType != null) {
          const walletRecieve = assetWalletByChain.filter(
            (wallet) => wallet.type === this.walletReceiveAssetType
          )[0];
          this.operationsService.setWalletRecieve(walletRecieve);
        } else {
          this.operationsService.setWalletRecieve(assetWalletByChain[0]);
        }
      }
    });

    // this.operationsService.poolIn$.subscribe((poolIn) => {});
    ///////////////

    //THEMING
    this.themeValue = localStorage.getItem('dcf-theme');

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }
  getWalletTypes(xdefiFilter: string[]): addressesTypes[] {
    const walletTypes: addressesTypes[] = [];
    for (let i = 0; i < xdefiFilter.length; i++) {
      if (xdefiFilter[i] == 'BNB') {
        walletTypes.push(addressesTypes.binance);
      } else if (xdefiFilter[i] == 'BTC') {
        walletTypes.push(addressesTypes.bitcoin);
      } else if (xdefiFilter[i] == 'BCH') {
        walletTypes.push(addressesTypes.bitcoincash);
      } else if (xdefiFilter[i] == 'DOGE') {
        walletTypes.push(addressesTypes.dogecoin);
      } else if (xdefiFilter[i] == 'ETH') {
        walletTypes.push(addressesTypes.ethereum);
      } else if (xdefiFilter[i] == 'LTC') {
        walletTypes.push(addressesTypes.litecoin);
      } else if (xdefiFilter[i] == 'THOR') {
        walletTypes.push(addressesTypes.thorchain);
      }
    }
    return walletTypes;
  }

  changeOperation(type: string) {
    this.data.operationType = type;
  }

  async connectXDEFI(addressesTypes: addressesTypes[]) {
    const { newUser } = await this.xdefiService.connectXDEFI();
    this.userService.setUser(newUser);
    consoleLog('RECONNECTED');
    localStorage.setItem('XDEFI_CONNECTED', 'true');
    this.user$ = this.userService.user$.subscribe((user) => {
      if (!user) {
        consoleLog('NO USER!!!!');
      } else {
        this.user = user;
      }
    });
    this.subs.push(this.user$);
  }

  selectWallet(address: WalletData) {
    this.selectedAddress = address;
    this.walletType = address.type as WalletType;
    this.getSelectedAddress();
    this.operationsService.setWalletSend(this.selectedAddress);

    this.operationsService.assetOut$.subscribe((assetOut) => {
      const WalletByChain = this.details.filter(
        (wallet) =>
          wallet.chain === assetOut.chain &&
          wallet.type === this.selectedAddress.type
      );
      if (WalletByChain.length > 0) {
        if (this.walletReceiveAssetType != null) {
          const walletRecieve = WalletByChain.filter(
            (wallet) => wallet.type === this.walletReceiveAssetType
          )[0];
          this.walletReceiveAsset = walletRecieve;
        } else {
          this.walletReceiveAsset = WalletByChain[0];
        }
        this.operationsService.setWalletRecieve(this.walletReceiveAsset);
      } else {
        const WalletByChainAny = this.details.filter(
          (wallet) =>
            wallet.chain === assetOut.chain &&
            wallet.type != this.selectedAddress.type
        );

        if (WalletByChainAny.length > 0) {
          this.walletReceiveAsset = WalletByChain[0];
          this.operationsService.setWalletRecieve(this.walletReceiveAsset);
        } else {
          this.operationsService.setWalletRecieve(null);
        }
      }
    });
  }

  getWalletPanelClass() {
    let panelClass = '';
    if (this.themeValue === 'light-theme') {
      panelClass = 'wallet-select-panel light';
    } else {
      panelClass = 'wallet-select-panel dark';
    }
    return panelClass;
  }

  setDisabled($event: boolean) {
    this.isDisabled = $event;
  }

  setCompleted($event: any) {
    this.dialogRef.close();
  }

  getSelectedAddress() {
    if (this.innerWidth > 960) {
      this.addressMask = this.selectedAddress.address;
    } else {
      this.addressMask = this.selectedAddress.mask;
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
