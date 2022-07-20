import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';

import { Asset } from '../../classes/asset';
import { AssetBalance } from '../../interfaces/asset-balance';
import { WalletData, MemberDetail } from '@dexShared/interfaces/marketcap';
import { RoundedValuePipe } from '@dexShared/pipes/rounded-value.pipe';
import { PoolTypeOption } from '../../constants/pool-type-options';
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';
import { TranslateService } from '@ngx-translate/core';

type AssetAndBalance = {
  asset: Asset;
  balance?: string;
};

type AssetTypeUnit = {
  asset: Asset;
  type: PoolTypeOption;
  units: number;
  wallet: WalletData;
  detail: {
    pool: string;
    runeAddress: string;
    assetAddress: string;
    liquidityUnits: string;
    runeAdded: string;
    assetAdded: string;
    runeWithdrawn: string;
    assetWithdrawn: string;
    dateFirstAdded: string;
    dateLastAdded: string;
  };
};

interface wrappedMembers {
  wallet: WalletData;
  lpData: MemberDetail;
}

@Component({
  selector: 'app-assets-dialog',
  templateUrl: './assets-dialog.component.html',
  styleUrls: ['./assets-dialog.component.scss'],
})
export class AssetsDialogComponent implements OnInit {
  loading: boolean;
  marketListItems: AssetAndBalance[];
  filteredMarketListItems: AssetAndBalance[];
  _searchTerm: string;
  walletData: WalletData[];
  poolLPList: AssetTypeUnit[] = [];
  filteredPoolLPList: AssetTypeUnit[] = [];

  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(term: string) {
    this._searchTerm = term;
    if (this.data.type == 'withdraw') {
      if (term && term.length > 0) {
        this.filteredPoolLPList = this.poolLPList.filter((item) => {
          const search = term.toUpperCase();
          return item.asset.fullname.includes(search);
        });
      } else {
        this.filteredPoolLPList = this.poolLPList;
      }
    } else {
      if (term && term.length > 0) {
        this.filteredMarketListItems = this.marketListItems.filter((item) => {
          const search = term.toUpperCase();
          return item.asset.fullname.includes(search);
        });
      } else {
        this.filteredMarketListItems = this.marketListItems;
      }
    }
  }

  public language: string;
  public translation: any;

  constructor(
    public dialogRef: MatDialogRef<AssetsDialogComponent>,
    private masterWalletManagerService: MasterWalletManagerService,
    private roundedValuePipe: RoundedValuePipe,
    private operationsService: MarketcapOperationsService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      field: any;
      disabledAssetSymbol: string;
      type: string;
      withdrawData?: wrappedMembers[];
    },
    public translate: TranslateService
  ) {}

  ngOnInit() {
    this.getPools();
    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  getPools() {
    this.loading = true;
    if (this.data.type == 'withdraw') {
      this.poolLPList = this.getLP().sort((a, b) => {
        if (!a.asset.fullname && !b.asset.fullname) {
          return 0;
        }
        if (a.asset.fullname < b.asset.fullname) {
          return -1;
        }
        if (a.asset.fullname > b.asset.fullname) {
          return 1;
        }
        return 0;
      });
      this.loading = false;
      this.filteredPoolLPList = this.poolLPList;
    } else {
      this.masterWalletManagerService.getOriginalPools().subscribe((pools) => {
        if (pools != null) {
          let orderedPools =
            this.masterWalletManagerService.orderTableByFieldDesc(
              pools.filter((pool) => pool.asset.status == 'available'),
              'rune_depth',
              'USD'
            );
          this.marketListItems = orderedPools.map((pool) => {
            return { asset: new Asset(pool.asset.name) };
          });

          let _synthList: AssetAndBalance[] = [];
          //this.marketListItems.forEach(item => _synthList.push(Object.assign({}, item)));
          let _marketListItems = [...this.marketListItems];
          for (let i = 0; i < _marketListItems.length; i++) {
            let item = _marketListItems[i];
            let asset = new Asset(item.asset.fullname, true);
            let synthItem = {
              asset,
              balance: undefined,
            };
            _synthList.push(synthItem);
          }
          //this.marketListItems = [..._marketListItems, ..._synthList];
          this.marketListItems = [..._marketListItems];

          // Keeping RUNE at top by default
          if (this.data.type == 'swap' || this.data.type == 'send') {
            this.marketListItems.unshift({
              asset: new Asset('THOR.RUNE'),
            });
          }

          this.filteredMarketListItems = this.marketListItems;

          this.masterWalletManagerService.walletData$.subscribe(
            (walletData) => {
              if (walletData != null) {
                if (this.data.field == 'in') {
                  let walletsend = this.operationsService.getWalletSend();
                  this.walletData = walletData.filter(
                    (wallet) => wallet.type == walletsend.type
                  );
                } else {
                  let walletrecieve = this.operationsService.getWalletRecieve();
                  this.walletData = walletData.filter(
                    (wallet) => wallet.type == walletrecieve.type
                  );
                }
                this.sortMarketsByUserBalance();
              }
              this.loading = false;
            }
          );
        }
      });
    }
  }

  getLP(): AssetTypeUnit[] {
    let thorData = this.data.withdrawData.filter(
      (data) => data.wallet.chain == 'THOR'
    );
    let assetData = this.data.withdrawData.filter(
      (data) => data.wallet.chain != 'THOR'
    );

    let thorLpData = thorData.map(({ lpData }) => lpData.pools)[0];
    let assetLpData = assetData.map(({ lpData }) => lpData.pools);

    let assetLpAllData = [];
    for (let i = 0; i < assetLpData.length; i++) {
      for (let x = 0; x < assetLpData[i].length; x++) {
        assetLpAllData.push(assetLpData[i][x]);
      }
    }

    let symLps: AssetTypeUnit[] = [];
    for (let y = 0; y < thorLpData.length; y++) {
      let thorItem = JSON.stringify(thorLpData[y]);
      let lp: AssetTypeUnit;
      lp = {
        asset: new Asset(thorLpData[y].pool),
        type: this.itemIsInArray(thorItem, assetLpAllData)
          ? 'SYM'
          : 'ASYM_RUNE',
        wallet: thorData[0].wallet,
        units: +thorLpData[y].liquidityUnits / 100000000,
        detail: thorLpData[y],
      };
      symLps.push(lp);
    }

    for (let y = 0; y < assetLpAllData.length; y++) {
      let assetItem = JSON.stringify(assetLpAllData[y]);
      let lp: AssetTypeUnit;
      if (!this.itemIsInArray(assetItem, thorLpData)) {
        let asset = new Asset(assetLpAllData[y].pool);
        lp = {
          asset: asset,
          type: 'ASYM_ASSET',
          wallet: assetData.filter(
            (wallet) => wallet.wallet.chain == asset.chain
          )[0].wallet,
          units: +assetLpAllData[y].liquidityUnits / 100000000,
          detail: assetLpAllData[y],
        };
        symLps.push(lp);
      }
    }
    return symLps;
  }

  itemIsInArray(item: string, array: any[]): boolean {
    let isIn = false;
    for (let y = 0; y < array.length; y++) {
      let arrayItem = JSON.stringify(array[y]);
      if (item == arrayItem) {
        isIn = true;
      }
    }
    return isIn;
  }

  sortMarketsByUserBalance(): void {
    // Sort first by user balances
    if (this.walletData) {
      const balMap: {
        [key: string]: { balance: string; synth: boolean };
      } = {};
      this.walletData.forEach((item) => {
        for (let i = 0; i < item.balance.length; i++) {
          if (+item.balance[i].amount > 0) {
            let assetName =
              item.chain == 'THOR'
                ? this.getThorAsset(item.balance[i].asset)
                : item.chain + '.' + item.balance[i].asset;
            let assetBalance = 0;

            let synth =
              item.chain == 'THOR' && item.balance[i].asset.includes('/')
                ? true
                : false;
            if (item.chain == 'THOR') {
              assetBalance = +item.balance[i].amount / 100000000;
            } else if (item.chain == 'BCH') {
              assetBalance = +item.balance[i].amount / 100000000;
            } else if (item.chain == 'BNB') {
              assetName = new Asset(assetName).chainDotTicker;
              assetBalance = +item.balance[i].amount;
            } else if (item.chain == 'ETH') {
              assetName = item.balance[i].asset;
              if (assetName.includes('USDT')) {
                assetBalance = +item.balance[i].amount / 1000000;
              } else if (assetName.includes('USDC')) {
                assetBalance = +item.balance[i].amount / 1000000000;
              } else {
                assetBalance = +item.balance[i].amount / 1000000000000000000;
              }
            } else {
              assetBalance = +item.balance[i].amount;
            }

            balMap[assetName] = {
              balance: this.roundedValuePipe.transform(assetBalance),
              synth,
            };
          }
        }
      });

      for (let i = 0; i < this.marketListItems.length; i++) {
        if (
          balMap[this.marketListItems[i].asset.chainDotTicker] &&
          this.marketListItems[i].asset.synth ==
            balMap[this.marketListItems[i].asset.chainDotTicker].synth
        ) {
          this.marketListItems[i].balance =
            balMap[this.marketListItems[i].asset.chainDotTicker].balance;
        }
      }

      this.marketListItems = this.marketListItems.sort((a, b) => {
        if (!a.balance && !b.balance) {
          return 0;
        }
        if (!a.balance) {
          return 1;
        }
        if (!b.balance) {
          return -1;
        }
        return +b.balance - +a.balance;
      });

      if (this.data.field == 'in') {
        this.marketListItems = this.marketListItems.filter(
          (item) => item.balance != undefined
        );
      }
      this.filteredMarketListItems = this.marketListItems;
    }
  }

  selectToken(item: any) {
    if (item.asset.ticker !== this.data.disabledAssetSymbol) {
      let returnObject = {
        item: item,
        field: this.data.field,
      };
      this.dialogRef.close(returnObject);
    }
  }

  validateBalances() {
    return this.filteredMarketListItems
      ? this.filteredMarketListItems.some((item) => item.balance != undefined)
      : false;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getIconClass(asset: Asset) {
    let iconClass = '';
    if (asset.synth == true) {
      iconClass = 'asset-icon synth';
    } else {
      iconClass = 'asset-icon';
    }
    return iconClass;
  }
  getThorAsset(asset: string): string {
    let output = '';
    if (asset == 'rune') {
      output = 'THOR.RUNE';
    } else {
      let newAsset = new Asset(asset.replace('/', '.').toUpperCase(), true);
      output = newAsset.chainDotTicker;
    }
    return output;
  }
}

function removeDuplicates(arr: any) {
  var unique = arr.reduce(function (acc: any, curr: any) {
    if (!acc.includes(curr)) acc.push(curr);
    return acc;
  }, []);
  return unique;
}
