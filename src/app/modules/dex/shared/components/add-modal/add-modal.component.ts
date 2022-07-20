import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { formatNumber } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { combineLatest, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// DEPENDENCIES
import BigNumber from 'bignumber.js';

// XCHAIN
import { Balance } from '@xchainjs/xchain-client';
import {
  assetToString,
  baseAmount,
  assetToBase,
  assetAmount,
} from '@xchainjs/xchain-util';

// THORCHAIN
import {
  PoolData,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
} from '@thorchain/asgardex-util';

// CLASES
import { Asset } from '@dexShared/classes/asset';
import { PoolAddressDTO } from '@dexShared/classes/pool-address';
import { User } from '@dexShared/classes/user';
import { Pool } from '@dexShared/classes/pool';
import { Amount } from '@dexShared/classes/amount';
import { Liquidity } from '@dexShared/classes/liquidity';
import { Percent } from '@dexShared/classes/percentage';

// DIALOGS
import { AssetsDialogComponent } from '@dexShared/dialogs/assets-dialog/assets-dialog.component';
import { ConfirmKeystorePasswordComponent } from '@dexShared/dialogs/confirm-keystore-password/confirm-keystore-password.component';
import {
  ConfirmAddDialogComponent,
  ConfirmDepositData,
} from './confirm-add-dialog/confirm-add-dialog.component';
import { ConfirmTransactionDialogComponent } from '@dexShared/dialogs/confirm-transaction/confirm-transaction.component';

// INTERFACES
import { PoolDTO } from '@dexShared/interfaces/pool';
import {
  WalletData,
  MidgardPool,
  Stats,
} from '@dexShared/interfaces/marketcap';

// SERVICES
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';
import { WalletBalanceService } from '@dexShared/services/wallet-balance.service';
import { MidgardService } from '@dexShared/services/midgard.service';
import { AssestUsdPriceService } from '@dexShared/services/assest-usd-price.service';
import { TransactionUtilsService } from '@dexShared/services/transaction-utils.service';
import { UserService } from '@dexShared/services/user.service';

// CONSTANTS
import {
  PoolTypeOption,
  AvailablePoolTypeOptions,
} from '@dexShared/constants/pool-type-options';
import { consoleLog } from '@app/utils/consoles';
import { TranslateService } from '@ngx-translate/core';

interface iUpdateAssetUnits {
  inputValue: number;
  isRune: boolean;
  name?: 'send' | 'received';
}

@Component({
  selector: 'app-add-modal',
  templateUrl: './add-modal.component.html',
  styleUrls: ['./add-modal.component.scss'],
})
export class AddModalComponent implements OnInit, OnDestroy {
  @Output() isDisabled = new EventEmitter<boolean>();

  public operation: 'add' = 'add';
  public walletReceiveAsset: WalletData;
  public walletSendAsset: WalletData;

  public originalPools: MidgardPool[];
  public originalStats: Stats;
  public runePriceUSD: number;

  // COLOR THEME
  public themeValue = '';
  public dialogPanelClass: string;
  public dialogBackdropColorClass: string;

  // BALANCES STUFF
  public balanceIn: number;
  public balanceOut: number;
  public balanceInUSD: number;
  public balanceOutUSD: number;
  public hintIn = '0';
  public hintOut = '0';

  //public assetSelected: MarketPool;
  private liquidityEntity: Liquidity;

  public inputUsdValueIn = '$0.00';
  public inputUsdValueOut = '$0.00';

  public subs: Subscription[] = [];

  public assetUnitIn = new FormControl(0);
  public assetUnitOut = new FormControl(0);

  public assetUnitInHint: string;
  public showConfirm = false;
  public rune = 'RUNE'; //environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C'
  public bnb = 'BNB';
  public assetIn: Asset = new Asset(`BNB.${this.bnb}`);
  public assetOut: Asset = new Asset(`THOR.${this.rune}`);

  public basePrice: number;
  // public assetTokenValueIn: BaseAmount;
  public assetTokenValueIn: Amount;
  public slip: number | string;
  public balances: Balance[];
  public poolDetailOutError: boolean;
  public poolDetailInError: boolean;
  public poolDetailMap: { [key: string]: PoolDTO } = {};
  public targetAssetUnit: BigNumber;

  private inboundFees: { [key: string]: number } = {};
  private outboundFees: { [key: string]: number } = {};

  networkFeeIn: number;
  networkFeeOut: number;
  inboundFeeToUsdValue: number;
  totalFeeToUSD: number;
  haltedChains: string[];

  poolShareEst: any;

  availablePools: PoolDTO[];
  ethPool: PoolDTO;
  inboundAddresses: PoolAddressDTO[];

  user: User[];
  value = 0;

  public maxInValue = 1000;
  public minInValue = 0;
  // asymAsset: boolean = false;
  // asym: boolean = true;
  // asymRune: boolean = false;

  poolType: PoolTypeOption;
  poolTypeOptions: AvailablePoolTypeOptions = {
    asymAsset: false,
    asymRune: false,
    sym: true,
  };

  assetPoolData: PoolData;
  pools: Pool[];
  pool: Pool;
  network: string;

  public addIsValid: boolean;
  public hasWallet: boolean;

  public language: string;
  public translation: any;

  constructor(
    public dialog: MatDialog,
    public walletBalanceService: WalletBalanceService,
    private assestUsdPriceService: AssestUsdPriceService,
    private userService: UserService,
    private midgardService: MidgardService,
    private txUtilsService: TransactionUtilsService,
    private operationsService: MarketcapOperationsService,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    this.haltedChains = [];
    this.poolType = 'SYM';

    const user$ = this.userService.user$.subscribe(async (user) => {
      this.user = user;
    });

    this.subs = [
      user$,
      // slippageTolerange$
    ];
  }

  ngOnInit(): void {
    const walletSendSub = this.operationsService.walletSend$.subscribe(
      (walletSend) => {
        if (walletSend != null) {
          if (this.walletSendAsset && this.walletReceiveAsset) {
            this.hasWallet = true;
          } else {
            this.hasWallet = false;
          }
        }
        this.walletSendAsset = walletSend;

        const assetInSub = this.operationsService.assetIn$.subscribe(
          (assetIn) => {
            if (assetIn.isRUNE() == false) {
              // REASSING ASSETS DEPENDING OF THE SELECTED TOKEN
              this.assetIn = assetIn;

              const walletBalance = this.walletSendAsset.balance;
              let tempBalance = 0;
              for (let i = 0; i < walletBalance.length; i++) {
                if (
                  this.assetIn.chain != 'ETH' &&
                  walletBalance[i].asset == this.assetIn.symbol
                ) {
                  walletBalance[i].asset == 'BCH' ||
                  walletBalance[i].asset == 'rune'
                    ? (tempBalance = walletBalance[i].amount / 100000000)
                    : (tempBalance = walletBalance[i].amount);
                } else if (this.assetIn.chain == 'ETH') {
                  const walletAsset = new Asset(walletBalance[i].asset);
                  if (walletAsset.symbol === this.assetIn.ticker) {
                    tempBalance = walletBalance[i].amount / Math.pow(10, 18);
                  }
                }
              }
              this.balanceIn = tempBalance;

              this.assestUsdPriceService
                .calUsdPrice(this.balanceIn, this.assetIn.fullname)
                .then((usd) => {
                  this.balanceInUSD = usd;
                });
            } else {
              const poolInSub = this.operationsService.poolIn$.subscribe(
                (poolIn) => {
                  this.operationsService.setAssetIn(
                    new Asset(poolIn.asset.fullname)
                  );
                  this.operationsService.setAssetOut(new Asset('THOR.RUNE'));
                }
              );
              this.subs.push(poolInSub);
            }
          }
        );

        this.subs.push(assetInSub);
      }
    );

    const walletDataSub = this.masterWalletManagerService.walletData$.subscribe(
      (walletData) => {
        if (walletData != null) {
          this.walletReceiveAsset = walletData?.filter(
            (wallet) => wallet.chain === 'THOR'
          )[0];
          if (this.walletSendAsset && this.walletReceiveAsset) {
            this.hasWallet = true;
          } else {
            this.hasWallet = false;
          }
        }
      }
    );

    const walletRecieveSub = this.operationsService.walletRecieve$.subscribe(
      (walletRecieve) => {
        if (walletRecieve != null) {
          this.walletReceiveAsset = walletRecieve;
          if (this.walletSendAsset && this.walletReceiveAsset) {
            this.hasWallet = true;
          } else {
            this.hasWallet = false;
          }
          this.getBalances();
        }
      }
    );

    const originalStatsSub =
      this.masterWalletManagerService.originalStats$.subscribe((stats) => {
        if (stats !== null) {
          this.runePriceUSD = +stats.runePriceUSD;
          this.originalStats = stats;
        }
      });

    const originalPoolsSub = this.masterWalletManagerService
      .getOriginalPools()
      .subscribe((pools) => {
        if (pools != null) {
          this.originalPools = pools;
        }
      });

    this.subs.push(
      walletSendSub,
      walletRecieveSub,
      originalStatsSub,
      originalPoolsSub,
      walletDataSub
    );

    // REASSING ASSETS DEPENDING OF THE SELECTED TOKEN
    //this.assetIn = new Asset(this.assetSelected.asset.fullname);
    this.assetOut = new Asset('THOR.RUNE');

    this.getBalances();

    const inboundAddresses$ = this.midgardService.getInboundAddresses();
    const pools$ = this.midgardService.getPools();
    const combined = combineLatest([inboundAddresses$, pools$]);

    const sub = timer(0, 30000)
      .pipe(
        switchMap(() => combined)
        //retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(([inboundAddresses, pools]) => {
        this.inboundAddresses = inboundAddresses;

        // check for halted chains
        this.setHaltedChains();

        // set ETH pool if available
        const ethPool = pools.find((pool) => pool.asset === 'ETH.ETH');
        if (ethPool) {
          this.ethPool = ethPool;
        }

        this.setAvailablePools(pools);

        this.getLiquidityUnits(pools);

        // update network fees
        this.setNetworkFees();
      });

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue === '' || this.themeValue === 'light-theme') {
      localStorage.setItem('dcf-theme', this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }
    this.subs.push(sub);

    this.isDisabled.emit(false);

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  changeSubOperacion(operationType: PoolTypeOption) {
    this.poolType = operationType;
    switch (operationType) {
      case 'ASYM_ASSET':
        this.poolTypeOptions = {
          asymAsset: true,
          asymRune: false,
          sym: false,
        };
        this.showConfirm = false;
        this.updateAddDetails();
        break;
      case 'SYM':
        this.poolTypeOptions = {
          sym: true,
          asymAsset: false,
          asymRune: false,
        };
        this.showConfirm = false;
        this.updateAddDetails();
        break;
      case 'ASYM_RUNE':
        this.poolTypeOptions = {
          asymRune: true,
          asymAsset: false,
          sym: false,
        };
        this.showConfirm = false;
        this.updateAddDetails();
        break;
      default:
        this.poolTypeOptions = {
          asymAsset: false,
          asymRune: false,
          sym: true,
        };
        this.showConfirm = false;
    }
    // update network fees
    //this.setNetworkFees();
    this.setFees();
    this.clean();
  }

  /*confirmAdd(goBack: boolean = true) {
    if (!goBack) {
      const state: PoolTypeOption =
        this.poolTypeOptions.asymRune === true
          ? 'ASYM_RUNE'
          : this.poolTypeOptions.asymAsset === true
          ? 'ASYM_ASSET'
          : 'SYM';
      this.poolType = state;
      this.showConfirm = false;
    } else {

      this.showConfirm = true;
    }

  }*/

  setHaltedChains() {
    this.haltedChains = this.inboundAddresses
      .filter((inboundAddress) => inboundAddress.halted)
      .map((inboundAddress) => inboundAddress.chain);
  }

  setAvailablePools(pools: PoolDTO[]) {
    this.availablePools = pools
      .filter((pool) => pool.status === 'available')
      .filter(
        (pool) => !this.haltedChains.includes(new Asset(pool.asset).chain)
      );

    this.pools = this.availablePools.map((pool) => {
      // INPROOVE
      return new Pool(
        new Asset(pool.asset),
        new Amount(pool.runeDepth, 1, 8),
        new Amount(pool.assetDepth, 1, 8),
        pool
      );
    });
  }

  async setNetworkFees() {
    if (!this.availablePools || !this.inboundAddresses) {
      return;
    }

    for (const pool of this.availablePools) {
      const asset = new Asset(pool.asset);

      const assetOutboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'OUTBOUND',
        pool
      );

      const assetInboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'INBOUND',
        pool
      );

      this.outboundFees[pool.asset] = assetOutboundFee;
      this.inboundFees[pool.asset] = assetInboundFee;
    }

    // set THOR.RUNE network fees
    this.outboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'OUTBOUND'
    );

    this.inboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'INBOUND'
    );

    const inboundFee = this.inboundFees[assetToString(this.assetIn)];
    const outboundFee = this.outboundFees[assetToString(this.assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;

    const assetInUSDPrice = +this.originalPools.filter(
      (pool) => pool.asset.name == this.assetIn.fullname
    )[0].asset_price_usd;

    const inboundFeeToUSD = inboundFee * assetInUSDPrice;

    const outboundFeeToUSD = outboundFee * this.runePriceUSD;

    this.inboundFeeToUsdValue =
      this.poolType === 'ASYM_ASSET' ? inboundFeeToUSD : outboundFeeToUSD;

    this.totalFeeToUSD = inboundFeeToUSD + outboundFeeToUSD;
  }

  async getLiquidityUnits(pools: PoolDTO[]) {
    const fullname =
      this.assetIn.symbol === 'RUNE'
        ? `${this.assetOut.chain}.${this.assetOut.symbol}`
        : `${this.assetIn.chain}.${this.assetIn.symbol}`;

    /*const res = await this.midgardService
      .getMembersDetail(this.walletReceiveAsset?.address)
      .toPromise()
      .catch((err) => {

      });*/

    //const member = res && res.pools.filter(({ pool }) => pool === fullname)[0];

    if (pools) {
      const poolItem = pools.filter(({ asset }) => asset === fullname)[0];

      const pool = new Pool(
        poolItem.asset as unknown as Asset,
        new Amount(poolItem.runeDepth, 1, 8),
        new Amount(poolItem.assetDepth, 1, 8),
        poolItem
      );

      /*this.liquidityEntity = new Liquidity(
        pool,
        Amount.fromMidgard(member?.liquidityUnits ?? 0)
      );*/
      this.liquidityEntity = new Liquidity(pool, Amount.fromMidgard(0));

      this.pool = pool;
    }
  }

  async getBalances() {
    const walletBalance = this.walletSendAsset.balance;
    let tempBalance = 0;
    for (let i = 0; i < walletBalance.length; i++) {
      if (walletBalance[i].asset == this.assetIn.symbol) {
        walletBalance[i].asset == 'BCH' || walletBalance[i].asset == 'rune'
          ? (tempBalance = walletBalance[i].amount / 100000000)
          : (tempBalance = walletBalance[i].amount);

        this.balanceIn = tempBalance;
      }
    }

    this.balanceOut =
      this.walletReceiveAsset.balance.map(({ amount }) => amount)[0] /
      Math.pow(10, 8);

    this.balanceInUSD = await this.assestUsdPriceService.calUsdPrice(
      this.balanceIn,
      this.assetIn.fullname
    );
    this.balanceOutUSD = await this.assestUsdPriceService.calUsdPrice(
      this.balanceOut,
      this.assetOut.fullname
    );
  }

  // HERE WE RECEIVED THE VALUE FROM INPUT
  async inputValueComing(res: iUpdateAssetUnits) {
    if (res.inputValue != 0) {
      this.addIsValid = true;
    } else {
      this.addIsValid = false;
    }

    if (res.name === 'received') {
      consoleLog('REC');

      if (this.balanceOut !== 0) {
        const max = this.maximumSpendableBalance(
          this.assetOut.ticker,
          this.balanceOut,
          res.inputValue
        );
        res.inputValue = max;
      }

      this.assetUnitOut.setValue(
        isNaN(res.inputValue) ? 0 : res.inputValue ?? 0
      );

      this.getParams();
    } else {
      consoleLog('SEN');

      if (this.balanceIn !== 0) {
        const max = this.maximumSpendableBalance(
          this.assetIn.ticker,
          this.balanceIn,
          res.inputValue
        );
        res.inputValue = max;
      }

      this.assetUnitIn.setValue(
        isNaN(res.inputValue) ? 0 : res.inputValue ?? 0
      );

      // this.assetTokenValueIn = assetToBase(assetAmount(inputValue));
      this.assetTokenValueIn = Amount.fromAssetAmount(res.inputValue, 8);

      if (this.assetIn && this.assetIn.symbol !== this.rune) {
        this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
      } else if (this.assetIn && this.assetIn.symbol === this.rune) {
        this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
        this.updateAddDetails();
      }
    }
  }

  setAsset(field: 'in' | 'out') {
    let selectedToken = '';
    if (field === 'out') {
      selectedToken = this.assetIn.ticker;
    } else {
      selectedToken = 'RUNE';
    }

    const dialogRef = this.dialog.open(AssetsDialogComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: { field, disabledAssetSymbol: selectedToken, type: 'add' },
    });

    dialogRef.afterClosed().subscribe((selection) => {
      if (selection != undefined) {
        if (selection.field == 'in') {
          this.assetIn = selection.item.asset;
          this.operationsService.setAssetIn(this.assetIn);
          this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
        }

        if (this.assetUnitIn.value > this.balanceIn) {
          const max = this.maximumSpendableBalance(
            this.assetIn.ticker,
            this.balanceIn,
            0
          );
          this.assetUnitIn.setValue(max);
        }

        this.setFees();
      }
    });
  }

  getPoolDetails(chain: string, symbol: string, type: 'in' | 'out') {
    this.poolDetailOutError = type === 'out' ? false : this.poolDetailOutError;
    this.poolDetailInError = type === 'in' ? false : this.poolDetailInError;

    this.midgardService.getPoolDetails(`${chain}.${symbol}`).subscribe(
      (res) => {
        if (res) {
          this.assetPoolData = {
            assetBalance: baseAmount(res.assetDepth),
            runeBalance: baseAmount(res.runeDepth),
          };
          this.poolDetailMap[symbol] = res;
          this.updateAddDetails();
        }
      },
      (err) => {
        console.error('error fetching pool details: ', err);
        this.poolDetailOutError =
          type === 'out' ? true : this.poolDetailOutError;
        this.poolDetailInError = type === 'in' ? true : this.poolDetailInError;
      }
    );
  }

  updateAddDetails() {
    if (this.assetIn && this.assetOut) {
      this.calculateSingleSwap();
    }
  }

  async calculateSingleSwap() {
    const toRune = this.assetOut.symbol === this.rune ? true : false;

    const poolDetail = toRune
      ? this.poolDetailMap[this.assetIn.symbol]
      : this.poolDetailMap[this.assetOut.symbol];

    if (poolDetail) {
      /**
       * TO SHOW BASE PRICE
       */

      const valueOfRuneInAsset = getValueOfRuneInAsset(
        assetToBase(assetAmount(1)),
        this.assetPoolData
      );
      const valueOfAssetInRune = getValueOfAssetInRune(
        assetToBase(assetAmount(1)),
        this.assetPoolData
      );

      const basePrice = toRune ? valueOfRuneInAsset : valueOfAssetInRune;
      this.basePrice = basePrice
        .amount()
        .div(10 ** 8)
        .toNumber();

      const outValue = this.assetTokenValueIn
        .mul(this.pool?.assetPriceInRune)
        .assetAmount.toNumber();

      //when the max value in $ of asset is higher than max value in $ of rune. set the max value of rune.
      if (this.poolType === 'SYM' && outValue > this.balanceOut) {
        let mustAssetTokenValueIn =
          this.balanceOut / +this.pool?.detail.assetPrice;
        mustAssetTokenValueIn =
          mustAssetTokenValueIn - mustAssetTokenValueIn * 0.005;

        this.inputValueComing({
          inputValue: mustAssetTokenValueIn,
          isRune: false,
          name: 'send',
        });
      }

      this.assetUnitOut.setValue(isNaN(outValue) ? 0 : outValue ?? 0);

      this.getParams();
    }
  }

  async getParams() {
    const inUSD = this.assestUsdPriceService.getPrice({
      inputAsset: this.assetIn,
      pools: this.pools,
      inputAmount:
        isNaN(this.assetUnitIn.value) || this.assetUnitIn.value < 0
          ? 0
          : this.assetUnitIn.value === ''
          ? 0
          : this.assetUnitIn.value ?? 0,
    });

    const outUSD = this.assestUsdPriceService.getPrice({
      inputAsset: this.assetOut,
      pools: this.pools,
      inputAmount:
        isNaN(this.assetUnitOut.value) || this.assetUnitOut.value < 0
          ? 0
          : this.assetUnitOut.value ?? 0,
    });

    this.inputUsdValueIn = inUSD.toCurrencyFormat(2);

    this.inputUsdValueOut = outUSD.toCurrencyFormat(2);

    /**
     * Slip percentage using original input
     */

    const assetInValue = Amount.fromAssetAmount(this.assetUnitIn.value, 8);
    const assetOutValue = Amount.fromAssetAmount(this.assetUnitOut.value, 8);

    const slip = this.liquidityEntity.getLiquiditySlip(
      assetInValue,
      assetOutValue
    ) as Percent;

    this.slip = slip.toFixed(8);

    /**
     * Fee percentage
     */

    const inboundFee = this.inboundFees[assetToString(this.assetIn)];
    const outboundFee = this.outboundFees[assetToString(this.assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;

    const assetInUSDPrice = +this.originalPools.filter(
      (pool) => pool.asset.name == this.assetIn.fullname
    )[0].asset_price_usd;

    const inboundFeeToUSD = inboundFee * assetInUSDPrice;

    const outboundFeeToUSD = outboundFee * this.runePriceUSD;

    this.inboundFeeToUsdValue =
      this.poolType === 'ASYM_ASSET' ? inboundFeeToUSD : outboundFeeToUSD;

    this.totalFeeToUSD = inboundFeeToUSD + outboundFeeToUSD;

    /**
     * Pool Share Estimated
     */

    this.poolShareEst = this.liquidityEntity
      .getPoolShareEst({
        assetAddAmount: assetInValue,
        runeAddAmount: assetOutValue,
      })
      .toFixed(8);
  }

  getTotalFeeUSD(): number {
    let assetInUSDPrice = 0;
    if (this.assetIn.isRUNE()) {
      assetInUSDPrice = this.runePriceUSD;
    } else {
      assetInUSDPrice = +this.originalPools.filter((pool) => {
        if (this.assetIn.chain === 'ETH') {
          return pool.asset.name === 'ETH.ETH';
        }
        if (this.assetIn.chain === 'BNB') {
          return pool.asset.name === 'BNB.BNB';
        }
        return pool.asset.name === this.assetIn.fullname;
      })[0].asset_price_usd;
    }

    let assetOutUSDPrice = 0;
    if (this.assetOut.isRUNE()) {
      assetOutUSDPrice = this.runePriceUSD;
    } else {
      assetOutUSDPrice = +this.originalPools.filter(
        (pool) => pool.asset.name == this.assetOut.fullname
      )[0].asset_price_usd;
    }

    const feeUsdValueIn = this.networkFeeIn * assetInUSDPrice;
    const feeUsdValueOut = this.networkFeeOut * assetOutUSDPrice;
    const totalFeeUSD = feeUsdValueIn + feeUsdValueOut;

    return totalFeeUSD;
  }

  setMax() {
    if (this.poolType !== 'ASYM_RUNE') {
      if (this.balanceIn) {
        const max = this.maximumSpendableBalance(
          this.assetIn.ticker,
          this.balanceIn,
          this.balanceIn
        );

        this.assetUnitIn.setValue(+formatNumber(Number(max), 'en-US', '0.0-8'));
        this.assetUnitInHint = '';

        // this.assetTokenValueIn = assetToBase(assetAmount(this.assetUnitIn.value));
        this.assetTokenValueIn = Amount.fromAssetAmount(
          this.assetUnitIn.value,
          8
        );
        if (this.assetIn && this.assetIn.symbol !== this.rune) {
          this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
        } else if (this.assetIn && this.assetIn.symbol === this.rune) {
          this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
          this.updateAddDetails();
        }
      }
    } else {
      if (this.balanceOut) {
        this.inputValueComing({
          inputValue: this.balanceOut,
          isRune: true,
          name: 'received',
        });
      }
    }
  }

  maximumSpendableBalance(asset: string, balance: number, inputValue: number) {
    if (asset === 'RUNE') {
      if (balance - inputValue <= this.networkFeeOut) {
        return inputValue - this.networkFeeOut;
      } else {
        return inputValue;
      }
    } else {
      if (balance - inputValue <= this.networkFeeIn) {
        return inputValue - this.networkFeeIn;
      } else {
        return inputValue;
      }
    }

    /*else if (asset === 'BNB') {
      let max = balance - 0.01 - 0.000375;
      return max >= 0 ? max : 0;
    } else {
      return balance;
    }*/
  }

  clean() {
    this.showConfirm = false;
    this.assetUnitOut.setValue(0);
    this.assetUnitIn.setValue(0);
    this.assetIn = new Asset(this.assetIn.fullname);
    this.assetOut = new Asset('THOR.RUNE');

    this.assetUnitInHint = '';
  }

  add() {
    const runeBasePrice = getValueOfAssetInRune(
      assetToBase(assetAmount(1)),
      this.assetPoolData
    )
      .amount()
      .div(10 ** 8)
      .toNumber();
    const assetBasePrice = getValueOfRuneInAsset(
      assetToBase(assetAmount(1)),
      this.assetPoolData
    )
      .amount()
      .div(10 ** 8)
      .toNumber();

    const confirmTransactionRef =
      this.walletSendAsset.type == 'keystore'
        ? this.dialog.open(ConfirmKeystorePasswordComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { confirmed: this.showConfirm },
          })
        : this.dialog.open(ConfirmTransactionDialogComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { confirmed: this.showConfirm },
          });

    confirmTransactionRef.afterClosed().subscribe((data) => {
      if (data.yes === true) {
        const user = this.user.filter(
          (u) => u.type == this.walletSendAsset.type
        )[0];
        const _balance: Balance[] = [];
        for (let i = 0; i < this.walletSendAsset.balance.length; i++) {
          const asset: Asset =
            this.walletSendAsset.chain !== 'ETH'
              ? new Asset(
                  this.walletSendAsset.chain +
                    '.' +
                    this.walletSendAsset.balance[i].asset
                )
              : new Asset(this.walletSendAsset.balance[i].asset);
          const amount = baseAmount(this.walletSendAsset.balance[i].amount);
          const itemBalance: Balance = {
            asset,
            amount,
          };
          _balance.push(itemBalance);
        }
        const dialogRef = this.dialog.open<
          ConfirmAddDialogComponent,
          ConfirmDepositData
        >(ConfirmAddDialogComponent, {
          //width: '50vw',
          //maxWidth: '420px',
          //minWidth: '260px',
          autoFocus: false,
          backdropClass: this.dialogBackdropColorClass,
          panelClass: this.dialogPanelClass,
          disableClose: true, // must be TRUE
          data: {
            asset: this.assetIn,
            rune: this.assetOut,
            assetAmount: this.assetUnitIn.value,
            runeAmount: this.assetUnitOut.value,
            user: user,
            balances: _balance,
            estimatedFee: this.networkFeeIn,
            runeFee: this.networkFeeOut,
            poolTypeOption: this.poolType,
            runeBasePrice,
            assetBasePrice,
          },
        });

        dialogRef.afterClosed().subscribe((transactionSuccess: boolean) => {
          const txSuccess = transactionSuccess;
          consoleLog(txSuccess);
          this.showConfirm = false;
          this.changeSubOperacion('SYM');
          this.isDisabled.emit(this.showConfirm);
        });
      }
    });
  }

  setIsValidForm(goBack = true) {
    const restIn = this.assetUnitIn.value - this.networkFeeIn;
    const restOut = this.assetUnitOut.value - this.networkFeeOut;
    if (goBack) {
      if (
        this.poolType === 'SYM' &&
        this.assetUnitIn.value > 0 &&
        this.balanceIn > 0 &&
        this.assetUnitOut.value > 0 &&
        this.balanceOut > 0 &&
        restIn > 0 &&
        restOut > 0
      ) {
        this.showConfirm = true;
      } else if (
        this.poolType === 'ASYM_ASSET' &&
        this.assetUnitIn.value > 0 &&
        this.balanceIn > 0 &&
        restIn > 0
      ) {
        this.showConfirm = true;
      } else if (
        this.poolType === 'ASYM_RUNE' &&
        this.assetUnitOut.value > 0 &&
        this.balanceOut > 0 &&
        restOut > 0
      ) {
        this.showConfirm = true;
      }

      if (this.haltedChains.find(this.assetIn.chain.toString)) {
        this.showConfirm = false;
      }
    } else {
      this.showConfirm = false;
    }

    this.isDisabled.emit(this.showConfirm);
  }

  setFees() {
    /**
     * Fee percentage
     */
    const inboundFee = this.inboundFees[assetToString(this.assetIn)];
    const outboundFee = this.outboundFees[assetToString(this.assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;

    this.totalFeeToUSD = this.getTotalFeeUSD();
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
