import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';

import { environment } from 'src/environments/environment';

// DEPENDENCIES
import BigNumber from 'bignumber.js';
import { combineLatest, Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  getSwapOutput,
  getDoubleSwapOutput,
  getSwapSlip,
  getDoubleSwapSlip,
  PoolData,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
} from '@thorchain/asgardex-util';

// XCHAINS
import {
  assetToString,
  assetToBase,
  assetAmount,
  baseAmount,
  BaseAmount,
  bn,
} from '@xchainjs/xchain-util';

// CLASES
import { Asset } from '@dexShared/classes/asset';
import { PoolAddressDTO } from '@dexShared/classes/pool-address';
import { User } from '@dexShared/classes/user';

// DIALOGS
import { ConfirmKeystorePasswordComponent } from '@dexShared/dialogs/confirm-keystore-password/confirm-keystore-password.component';
import { ConfirmDialogComponent } from '@dexShared/dialogs/confirm-dialog/confirm-dialog.component';
import { AssetsDialogComponent } from '@dexShared/dialogs/assets-dialog/assets-dialog.component';
import { RecieveWalletComponent } from '@dexShared/dialogs/recieve-wallet/recieve-wallet.component';
import {
  ConfirmSwapDialogComponent,
  SwapData,
} from './confirm-swap-dialog/confirm-swap-dialog.component';

// INTERFACES
import {
  WalletData,
  MidgardPool,
  Stats,
  spData,
  spDataResponse,
} from '@dexShared/interfaces/marketcap';
import { PoolDTO } from '@dexShared/interfaces/pool';

// SERVICES
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';
import { WalletBalanceService } from '@dexShared/services/wallet-balance.service';
import { MidgardService } from '@dexShared/services/midgard.service';
import { AssestUsdPriceService } from '@dexShared/services/assest-usd-price.service';
import { UserService } from '@dexShared/services/user.service';
import { TransactionUtilsService } from '@dexShared/services/transaction-utils.service';
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { consoleLog } from '@app/utils/consoles';

import { TranslateService } from '@ngx-translate/core';

// ENUMS
export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

export interface currencyOptions {
  align: string;
  prefix: string;
  suffix: string;
  thousands?: string;
  decimal?: string;
  allowNegative: boolean;
  precision: number;
  nullable: boolean;
  min: number;
  max: any;
  inputMode: CurrencyMaskInputMode;
}

@Component({
  selector: 'app-swap-modal',
  templateUrl: './swap-modal.component.html',
  styleUrls: ['./swap-modal.component.scss'],
})
export class SwapModalComponent implements OnInit, OnDestroy {
  @Input() type: 'swap';
  @Output() isDisabled = new EventEmitter<boolean>();
  @Output() isComplete = new EventEmitter<boolean>();

  public dcfEnvironment = environment.network;

  private inboundAddresses: PoolAddressDTO[];

  // SLIDER STUFFS
  public maxInValue = 1000;
  public minInValue = 0;
  public step = 0.0001;

  public rune = 'RUNE'; //'RUNE-67C'
  public bnb = 'BNB';
  public subs: Subscription[] = [];
  public user: User[];
  public basePrice: number;

  // WALLET
  public walletSendAsset: WalletData;
  public walletReceiveAsset: WalletData;
  public assetTokenValueIn: BaseAmount;
  public calculatingTargetAsset: boolean;
  public useSPProtection = false;
  public showSPConfirm = false;
  public SPLoading = true;
  public spDataRes: spDataResponse;

  // THEME
  public themeValue = '';
  public dialogPanelClass: string;
  public dialogBackdropColorClass: string;

  // POOL STUFF
  public availablePools: PoolDTO[];
  public poolDetailMap: { [key: string]: PoolDTO } = {};
  public poolDetailOutError: boolean;
  public poolDetailInError: boolean;
  private haltedChains: string[];

  public originalPools: MidgardPool[];
  public originalStats: Stats;

  // ASSETS STUFF
  public assetIn: Asset = new Asset(`BNB.${this.bnb}`); //default
  public assetOut: Asset = new Asset(`THOR.${this.rune}`); //default
  public assetUnitInUSD: string;
  public assetUnitOutUSD: string;
  public assetUnitIn = 0;
  public assetUnitInLabel = '0.00';
  public assetUnitOutLabel = '0.00';
  public assetUnitOut = new FormControl(0);
  public assetUnitInHint: string;
  public assetUnitInPerc = 0;
  public assetUnitInForm: FormGroup;
  public assetUnitOutForm: FormGroup;

  public inputUsdValueIn = 0;
  public inputUsdValueOut = 0;

  public targetAssetUnit: BigNumber;
  public runePriceUSD: number;

  // BALANCES STUFF
  public balanceIn: number;
  public balanceOut: number;
  public balanceInUSD: number;
  public balanceOutUSD: number;
  public hintIn = '0';
  public hintOut = '0';

  // SLIP
  public slip = 0;

  // FEE
  private inboundFees: { [key: string]: number } = {};
  private outboundFees: { [key: string]: number } = {};
  public networkFeeIn: number;
  public networkFeeOut: number;
  public totalFeeUSD = 0;

  // CONFIRMATIONS
  public showFeeDetails = false;
  public swapIsValid: boolean;
  public hasWallet: boolean;
  public affiliateFee = 0;
  public showConfirm: boolean;
  public swapConfirmed = false; // TO SEE

  public assetInOptions: currencyOptions = {
    align: 'left',
    prefix: '',
    suffix: '',
    thousands: ',',
    decimal: '.',
    allowNegative: false,
    precision: 4,
    nullable: false,
    min: 0,
    max: undefined,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
  };
  public assetOutOptions: currencyOptions = {
    align: 'left',
    prefix: '',
    suffix: '',
    thousands: ',',
    decimal: '.',
    allowNegative: false,
    precision: 10,
    nullable: false,
    min: 0,
    max: undefined,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
  };

  public spDataResMsg: string;

  public language: string;
  public translation: any;

  constructor(
    public dialog: MatDialog,
    public walletBalanceService: WalletBalanceService,
    public masterWalletBalanceService: MasterWalletManagerService,
    public assestUsdPriceService: AssestUsdPriceService,
    private userService: UserService,
    private midgardService: MidgardService,
    private txUtilsService: TransactionUtilsService,
    private operationsService: MarketcapOperationsService,
    private formBuilder: FormBuilder,
    public translate: TranslateService
  ) {
    const user$ = this.userService.user$.subscribe(async (user) => {
      this.user = user;
    });
    const originalPoolsSub = this.masterWalletBalanceService
      .getOriginalPools()
      .subscribe(async (pools) => {
        if (pools != null) {
          this.originalPools = pools;
        }
      });
    const originalStatsSub =
      this.masterWalletBalanceService.originalStats$.subscribe((stats) => {
        if (stats != null) {
          this.runePriceUSD = +stats.runePriceUSD;
          this.originalStats = stats;
        }
      });
    this.subs = [user$, originalPoolsSub, originalStatsSub];
  }

  ngOnInit() {
    this.assetUnitInForm = this.formBuilder.group({
      amount: [''],
    });
    this.assetUnitOutForm = this.formBuilder.group({
      amount: [''],
    });
    ///////////////
    this.assetInOptions.max = this.maxInValue;
    const walletSendSub = this.operationsService.walletSend$.subscribe(
      (walletSend) => {
        if (walletSend != null) {
          this.walletSendAsset = walletSend;

          if (this.walletSendAsset && this.walletReceiveAsset) {
            this.hasWallet = true;
          } else {
            this.hasWallet = false;
          }
          this.getBalances();
        }
      }
    );

    const assetInSub = this.operationsService.assetIn$.subscribe((assetIn) => {
      if (assetIn != null) {
        // REASSING ASSETS DEPENDING OF THE SELECTED TOKEN
        this.assetIn = assetIn;
        this.assetInOptions.prefix = assetIn.ticker + ' ';
        this.getBalances();
      }
    });

    this.subs.push(assetInSub);
    const assetOutSub = this.operationsService.assetOut$.subscribe(
      (assetOut) => {
        if (assetOut != null) {
          // REASSING ASSETS DEPENDING OF THE SELECTED TOKEN
          this.assetOut = assetOut;
          this.assetOutOptions.prefix = assetOut.ticker + ' ';
          this.getBalances();
        }
      }
    );
    this.subs.push(assetOutSub);
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

    const inboundAddresses$ = this.midgardService.getInboundAddresses();
    const pools$ = this.midgardService.getPools();
    const combined = combineLatest([inboundAddresses$, pools$]);

    const sub = timer(0, 30000)
      .pipe(
        switchMap(() => combined)
        //retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(([inboundAddresses, pools]) => {
        if (!this.inboundAddresses) {
          this.inboundAddresses = inboundAddresses;

          // check for halted chains
          this.setHaltedChains();

          this.setAvailablePools(pools);

          // update network fees
          this.setNetworkFees();
        }
      });

    //include all subcriptions for deleting on destroy event
    this.subs.push(sub, walletSendSub, walletRecieveSub);

    //THEMING

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    this.isDisabled.emit(false);

    this.masterWalletBalanceService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  // INNIT STUFFS
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
  }

  setNetworkFees() {
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

    this.setFees();
  }

  async getBalances() {
    const walletSendBalance = this.walletSendAsset?.balance;
    let tempSendBalance = 0;
    const walletReceiveBalance = this.walletReceiveAsset?.balance;
    let tempReceiveBalance = 0;
    if (walletSendBalance) {
      for (let i = 0; i < walletSendBalance.length; i++) {
        if (
          this.assetIn.chain != 'ETH' &&
          walletSendBalance[i].asset?.toLocaleUpperCase() ==
            this.assetIn.symbol?.toLocaleUpperCase()
        ) {
          walletSendBalance[i].asset == 'BCH' ||
          walletSendBalance[i].asset == 'rune'
            ? (tempSendBalance = walletSendBalance[i].amount / 100000000)
            : (tempSendBalance = walletSendBalance[i].amount);

          const precision = getPrecision(+tempSendBalance);
          this.assetInOptions.precision = precision == 0 ? 4 : precision;
          this.assetInOptions.max = +tempSendBalance;

          this.balanceIn = tempSendBalance;
        } else if (this.assetIn.chain == 'ETH') {
          const walletAsset = new Asset(walletSendBalance[i].asset);
          if (walletAsset.symbol === this.assetIn.ticker) {
            if (this.assetIn.ticker == 'USDC') {
              tempSendBalance = walletSendBalance[i].amount / Math.pow(10, 9);
            } else if (this.assetIn.ticker == 'USDT') {
              tempSendBalance = walletSendBalance[i].amount / Math.pow(10, 6);
            } else {
              tempSendBalance = walletSendBalance[i].amount / Math.pow(10, 18);
            }
            const precision = getPrecision(+tempSendBalance);
            this.assetInOptions.precision = precision == 0 ? 4 : precision;
            this.assetInOptions.max = +tempSendBalance;
          }
          this.balanceIn = tempSendBalance;
        }
      }
    }

    if (walletReceiveBalance) {
      for (let i = 0; i < walletReceiveBalance.length; i++) {
        if (
          this.assetOut.chain != 'ETH' &&
          walletReceiveBalance[i].asset?.toLocaleUpperCase() ==
            this.assetOut.symbol?.toLocaleUpperCase()
        ) {
          walletReceiveBalance[i].asset == 'BCH' ||
          walletReceiveBalance[i].asset == 'rune'
            ? (tempReceiveBalance = walletReceiveBalance[i].amount / 100000000)
            : (tempReceiveBalance = walletReceiveBalance[i].amount);

          this.balanceOut = tempReceiveBalance;
        } else if (this.assetOut.chain == 'ETH') {
          const walletAsset = new Asset(walletReceiveBalance[i].asset);
          if (walletAsset.symbol === this.assetOut.ticker) {
            tempReceiveBalance =
              walletReceiveBalance[i].amount / Math.pow(10, 18);
            const precision = getPrecision(+tempReceiveBalance);

            this.assetOutOptions.precision = precision === 0 ? 4 : precision;
            this.assetOutOptions.max = +tempReceiveBalance;
          }
          this.balanceOut = tempReceiveBalance;
        }
      }
    }

    this.balanceInUSD = await this.assestUsdPriceService.calUsdPrice(
      this.balanceIn,
      this.assetIn.fullname
    );
    this.balanceOutUSD = await this.assestUsdPriceService.calUsdPrice(
      this.balanceOut,
      this.assetOut.fullname
    );
  }

  // ASSETS STUFFS

  setAsset(field: string) {
    let selectedToken = '';
    if (field === 'out') {
      selectedToken = this.assetIn.ticker;
    } else {
      selectedToken = this.assetOut.ticker;
    }

    const dialogRef = this.dialog.open(AssetsDialogComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: { field, disabledAssetSymbol: selectedToken, type: 'swap' },
    });

    dialogRef.afterClosed().subscribe((selection) => {
      let value = 0;
      if (selection !== undefined) {
        if (selection.field == 'in') {
          this.assetIn = selection.item.asset;
          this.operationsService.setAssetIn(this.assetIn);
          this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
          this.updateAssetUnits('0.00');
          value = 0;
          this.assetUnitInPerc = 0;
          this.swapIsValid = false;
        } else {
          this.assetOut = selection.item.asset;
          this.operationsService.setAssetOut(this.assetOut);
          this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
          value = this.assetUnitIn;
        }

        this.updateAssetUnits(value);

        this.updateSwapDetails();

        if (this.assetUnitIn > this.balanceIn) {
          this.assetUnitIn = this.balanceIn;
          this.assetUnitInPerc = 100;
          this.swapIsValid = false;
        }
      }
      this.setFees();
    });
  }

  getPoolDetails(chain: string, symbol: string, type: 'in' | 'out') {
    if (chain == 'THOR') {
      return;
    }
    this.poolDetailOutError = type === 'out' ? false : this.poolDetailOutError;
    this.poolDetailInError = type === 'in' ? false : this.poolDetailInError;

    const pool = this.originalPools.filter((pool) =>
      pool.asset.name.startsWith(`${chain}.${symbol}`)
    )[0];

    this.midgardService.getPoolDetails(`${pool.asset.name}`).subscribe(
      (res) => {
        if (res) {
          this.poolDetailMap[symbol] = res;
          this.updateSwapDetails();
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

  updateSwapDetails() {
    if (this.assetIn && this.assetOut) {
      this.calculateTargetUnits();
    }
  }

  calculateTargetUnits() {
    if (this.assetTokenValueIn) {
      const swapType =
        this.assetIn.symbol === this.rune || this.assetOut.symbol === this.rune
          ? SwapType.SINGLE_SWAP
          : SwapType.DOUBLE_SWAP;

      if (swapType === SwapType.SINGLE_SWAP) {
        this.calculateSingleSwap();
      } else if (
        swapType === SwapType.DOUBLE_SWAP &&
        this.poolDetailMap[this.assetOut.symbol] &&
        this.poolDetailMap[this.assetIn.symbol]
      ) {
        this.calculateDoubleSwap();
      }
    }
  }

  /**
   * When RUNE is one of the assets being exchanged
   * For example RUNE <==> DAI
   */
  calculateSingleSwap() {
    const toRune = this.assetOut.symbol === this.rune ? true : false;

    const poolDetail = toRune
      ? this.poolDetailMap[this.assetIn.symbol]
      : this.poolDetailMap[this.assetOut.symbol];

    if (poolDetail) {
      const pool: PoolData = {
        assetBalance: baseAmount(poolDetail.assetDepth),
        runeBalance: baseAmount(poolDetail.runeDepth),
      };

      /**
       * TO SHOW BASE PRICE
       */
      const valueOfRuneInAsset = getValueOfRuneInAsset(
        assetToBase(assetAmount(1)),
        pool
      );
      const valueOfAssetInRune = getValueOfAssetInRune(
        assetToBase(assetAmount(1)),
        pool
      );

      const basePrice = toRune ? valueOfRuneInAsset : valueOfAssetInRune;
      this.basePrice = basePrice
        .amount()
        .div(10 ** 8)
        .toNumber();

      /**
       * Total output amount in target units minus 1 RUNE
       */

      if (
        this.balanceIn &&
        this.balanceIn - this.assetUnitIn <= this.networkFeeIn
      ) {
        this.assetUnitInLabel = (
          this.balanceIn - this.calcualteNetworkFee(this.networkFeeIn)
        ).toString();
        this.assetUnitIn =
          this.balanceIn - this.calcualteNetworkFee(this.networkFeeIn);

        this.assetUnitInPerc = (this.assetUnitIn * 100) / this.balanceIn;
      }

      const totalAmount = getSwapOutput(
        baseAmount(assetToBase(assetAmount(this.assetUnitIn)).amount()),
        pool,
        toRune
      );

      if (this.assetUnitIn) {
        this.targetAssetUnit = totalAmount.amount().isLessThan(0)
          ? bn(0)
          : totalAmount.amount();
      } else {
        this.targetAssetUnit = this.assetUnitIn
          ? totalAmount.amount().isLessThan(0)
            ? bn(0)
            : totalAmount.amount()
          : null;
      }

      this.targetAssetUnit =
        this.targetAssetUnit === null ? new BigNumber(0) : this.targetAssetUnit;

      /* AFFILIATE FEE CALCULATION */
      this.affiliateFee =
        +this.targetAssetUnit?.div(10 ** 8).toPrecision() * 0.0015;

      this.assetUnitOutLabel =
        this.targetAssetUnit
          ?.div(10 ** 8)
          .minus(this.networkFeeOut)
          .toNumber() > 0
          ? Number(
              this.targetAssetUnit
                ?.div(10 ** 8)
                .minus(this.networkFeeOut)
                .toPrecision()
            ).toString()
          : '0';

      this.assetUnitOut.setValue(
        this.targetAssetUnit
          ?.div(10 ** 8)
          .minus(this.networkFeeOut)
          .toNumber() > 0
          ? Number(
              this.targetAssetUnit
                ?.div(10 ** 8)
                .minus(this.networkFeeOut)
                .toPrecision()
            )
          : 0
      );
      this.getUSDValues();

      /**
       * Slip percentage using original input
       */

      const slip = getSwapSlip(this.assetTokenValueIn, pool, toRune);
      this.slip = slip.toNumber();

      this.swapIsValid =
        this.assetUnitIn > 0 &&
        this.targetAssetUnit
          ?.div(10 ** 8)
          .minus(this.networkFeeOut)
          .toNumber() > 0
          ? true
          : false;
    }
  }
  calcualteNetworkFee(networkFeeIn: number): number {
    if (
      this.assetIn.fullname == 'BNB.BNB' ||
      this.assetIn.fullname == 'BTC.BTC' ||
      this.assetIn.fullname == 'ETH.ETH' ||
      this.assetIn.fullname == 'LTC.LTC' ||
      this.assetIn.fullname == 'BCH.BCH' ||
      this.assetIn.fullname == 'THOR.RUNE' ||
      this.assetIn.fullname == 'DOGE.DOGE'
    ) {
      return networkFeeIn;
    } else {
      return 0;
    }
  }

  /**
   * When RUNE is one of the assets being exchanged
   * For example BTC <==> DAI
   */

  calculateDoubleSwap() {
    const sourcePool = this.poolDetailMap[`${this.assetIn.symbol}`];
    const targetPool = this.poolDetailMap[`${this.assetOut.symbol}`];

    if (sourcePool && targetPool) {
      const pool1: PoolData = {
        assetBalance: baseAmount(sourcePool.assetDepth),
        runeBalance: baseAmount(sourcePool.runeDepth),
      };
      const pool2: PoolData = {
        assetBalance: baseAmount(targetPool.assetDepth),
        runeBalance: baseAmount(targetPool.runeDepth),
      };

      const basePrice = getDoubleSwapOutput(
        assetToBase(assetAmount(1)),
        pool1,
        pool2
      );
      this.basePrice = basePrice
        .amount()
        .div(10 ** 8)
        .toNumber();

      if (
        this.balanceIn &&
        this.balanceIn - this.assetUnitIn <= this.networkFeeIn
      ) {
        this.assetUnitInLabel = (
          this.balanceIn - this.calcualteNetworkFee(this.networkFeeIn)
        ).toString();
        this.assetUnitIn =
          this.balanceIn - this.calcualteNetworkFee(this.networkFeeIn);

        this.assetUnitInPerc = (this.assetUnitIn * 100) / this.balanceIn;
      }
      const total = getDoubleSwapOutput(
        assetToBase(assetAmount(this.assetUnitIn)),
        pool1,
        pool2
      );

      if (this.assetUnitIn) {
        this.targetAssetUnit = total.amount().isLessThan(0)
          ? bn(0)
          : total.amount();
      } else {
        this.targetAssetUnit = bn(0);
      }

      /* AFFILIATE FEE CALCULATION */
      this.affiliateFee =
        +this.targetAssetUnit?.div(10 ** 8).toPrecision() * 0.0015;

      const totalFeeAssetOut = this.totalFeeUSD / +targetPool.assetPriceUSD;

      this.assetUnitOutLabel =
        this.targetAssetUnit
          ?.div(10 ** 8)
          .minus(totalFeeAssetOut)
          .toNumber() > 0
          ? Number(
              this.targetAssetUnit
                ?.div(10 ** 8)
                .minus(totalFeeAssetOut)
                .toPrecision()
            ).toString()
          : '0';

      /**
       * Slip
       */

      const slip = getDoubleSwapSlip(this.assetTokenValueIn, pool1, pool2);
      this.slip = slip.toNumber();

      this.assetUnitOut.setValue(
        this.targetAssetUnit
          ?.div(10 ** 8)
          .minus(totalFeeAssetOut)
          .toNumber() > 0
          ? Number(
              this.targetAssetUnit
                .div(10 ** 8)
                .minus(totalFeeAssetOut)
                .toPrecision()
            )
          : 0
      );
      this.getUSDValues();

      this.swapIsValid =
        this.assetUnitIn > 0 &&
        this.targetAssetUnit
          ?.div(10 ** 8)
          .minus(totalFeeAssetOut)
          .toNumber() > 0
          ? true
          : false;
    }
  }

  setFees() {
    /**
     * Fee percentage
     */
    const assetIn =
      this.assetIn.chain == 'ETH' ? new Asset('ETH.ETH') : this.assetIn;
    const assetOut =
      this.assetOut.chain == 'ETH' ? new Asset('ETH.ETH') : this.assetOut;

    const inboundFee = this.inboundFees[assetToString(assetIn)];
    const outboundFee = this.outboundFees[assetToString(assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;
    consoleLog(this.inboundFees, this.networkFeeIn);

    this.totalFeeUSD = this.getTotalFeeUSD();
  }

  setMax() {
    if (this.balanceIn !== undefined && this.balanceIn !== 0) {
      this.updateAssetUnits(this.balanceIn);
    } else {
      this.updateAssetUnits(this.maxInValue);
    }
    this.assetUnitInPerc = 100;
  }

  calculateAssetUnits(perc: number) {
    // consoleLog({ perc });
    let result = 0;

    if (this.balanceIn) {
      result = (this.balanceIn * perc) / 100;
    } else {
      result = (this.maxInValue * perc) / 100;
    }
    this.updateAssetUnits(result, perc);
  }

  formatLabel(value: number) {
    return Math.floor(value) + '%';
  }

  updateAssetUnits(val: any, perc?: number) {
    this.assetUnitInLabel = val;

    let inputNumber = Number(val);

    if (this.balanceIn !== 0 && inputNumber > this.balanceIn) {
      //this.assetUnitInHint = 'Not enough balance';
      inputNumber = this.balanceIn;
    } else {
      inputNumber === 0 && perc > 0 ? val : inputNumber;
    }

    this.assetUnitInLabel = inputNumber.toString();
    this.assetUnitIn = inputNumber;

    // SETTING SLIDER VALUE
    if (perc) {
      this.assetUnitInPerc = perc;
    } else {
      if (this.balanceIn) {
        this.assetUnitInPerc = (inputNumber * 100) / this.balanceIn;
      } else {
        this.assetUnitInPerc = (inputNumber * 100) / this.maxInValue;
      }
    }

    this.assetTokenValueIn = assetToBase(assetAmount(inputNumber));
    if (this.assetIn && this.assetIn.symbol !== this.rune) {
      this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
    } else if (this.assetIn && this.assetIn.symbol === this.rune) {
      this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
      this.updateSwapDetails();
    }
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
      assetOutUSDPrice = +this.originalPools.filter((pool) => {
        if (this.assetOut.chain === 'ETH') {
          return pool.asset.name === 'ETH.ETH';
        } else if (this.assetOut.chain === 'BNB') {
          return pool.asset.name === 'BNB.BNB';
        } else {
          return pool.asset.name === this.assetOut.fullname;
        }
      })[0]?.asset_price_usd;
    }

    // let affiliateFeeUSDPrice = 0;
    // if (this.assetOut.chain == 'THOR') {
    //   this.masterWalletBalanceService.originalStats$.subscribe((stats) => {
    //     affiliateFeeUSDPrice = +stats.runePriceUSD;
    //   });
    // } else {
    //   affiliateFeeUSDPrice = +this.originalPools.filter((pool) => {
    //     return pool.asset.name === this.assetOut.fullname;
    //   })[0]?.asset_price_usd;
    // }

    const feeUsdValueIn = this.networkFeeIn * assetInUSDPrice;
    const feeUsdValueOut = this.networkFeeOut * assetOutUSDPrice;
    //let affiliateFeeUSD = this.affiliateFee * affiliateFeeUSDPrice;
    const affiliateFeeUSD = 0;
    const totalFeeUSD = feeUsdValueIn + feeUsdValueOut + affiliateFeeUSD;

    return totalFeeUSD;
  }

  getUSDValues() {
    let assetInUSDPrice = 0;
    if (this.assetIn.isRUNE()) {
      assetInUSDPrice = this.runePriceUSD;
    } else {
      assetInUSDPrice = +this.originalPools.filter(
        (pool) => pool.asset.name == this.assetIn.fullname
      )[0].asset_price_usd;
    }

    let assetOutUSDPrice = 0;
    if (this.assetOut.isRUNE()) {
      assetOutUSDPrice = this.runePriceUSD;
    } else {
      assetOutUSDPrice = +this.originalPools.filter(
        (pool) => pool.asset.name == this.assetOut.fullname
      )[0].asset_price_usd;
    }

    this.inputUsdValueIn =
      this.assetUnitIn < 0 ? 0 : this.assetUnitIn * assetInUSDPrice;
    this.inputUsdValueOut =
      this.assetUnitOut.value < 0
        ? 0
        : this.assetUnitOut.value * assetOutUSDPrice;
  }

  // BUTTOM SWAP

  assetSwap() {
    const _assetIn = this.assetIn;
    const _assetOut = this.assetOut;
    this.assetIn = _assetOut;
    this.assetOut = _assetIn;

    const _assetUnit = this.assetUnitIn;
    this.assetUnitIn = this.assetUnitOut.value;
    this.assetUnitOut.setValue(_assetUnit);

    const _hint = this.hintIn;
    this.hintIn = this.hintOut;
    this.hintOut = _hint;

    this.operationsService.setAssetIn(this.assetIn);
    this.operationsService.setAssetOut(this.assetOut);

    if (this.operationsService.getWalletRecieveType() != null) {
      this.operationsService.setWalletRecieveType(null);
    }

    const assetIn =
      this.assetIn.chain == 'ETH' ? new Asset('ETH.ETH') : this.assetIn;
    const assetOut =
      this.assetOut.chain == 'ETH' ? new Asset('ETH.ETH') : this.assetOut;

    const inboundFee = this.inboundFees[assetToString(assetIn)];
    const outboundFee = this.outboundFees[assetToString(assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;
    consoleLog(this.inboundFees, this.networkFeeIn);

    this.totalFeeUSD = this.getTotalFeeUSD();

    this.updateAssetUnits(this.assetUnitIn.toString());
  }

  // SWAP STUFFS
  confirmSwap() {
    if (this.swapIsValid == true && this.hasWallet == true) {
      if (
        this.basePrice > 0 &&
        this.assetOut &&
        this.assetIn &&
        this.assetUnitIn > 0 //&&
        //this.slip * 100 < 5
      ) {
        if (this.useSPProtection == false) {
          this.showConfirm = true;
          this.isDisabled.emit(true);
        } else {
          this.getSPVAlues();
        }
      }
    }
  }

  getSPVAlues() {
    this.showSPConfirm = true;
    const spData: spData = {
      amount: this.assetUnitIn,
      input_asset: this.assetIn.fullname,
      output_asset: this.assetOut.fullname,
    };
    this.masterWalletBalanceService.getSP(spData).subscribe((spr) => {
      this.spDataResMsg = spr.details;
      this.SPLoading = false;
      this.spDataRes = spr;
    });
  }

  // CONTROLS
  backSwap() {
    // FPR NORMAL TX
    this.showConfirm = false;
    //FOR SP TX
    this.showSPConfirm = false;
    this.SPLoading = true;
    //
    this.isDisabled.emit(false);
  }

  swap() {
    const forgetDialogRef =
      this.walletSendAsset.type === 'keystore'
        ? this.dialog.open(ConfirmKeystorePasswordComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { swapConfirmed: this.swapConfirmed },
          })
        : this.dialog.open(ConfirmDialogComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { swapConfirmed: this.swapConfirmed },
          });

    forgetDialogRef.afterClosed().subscribe((data) => {
      if (data.yes === true) {
        const user = this.user.filter(
          (u) => u.type == this.walletSendAsset.type
        )[0];

        const dialogRef = this.dialog.open<
          ConfirmSwapDialogComponent,
          SwapData
        >(ConfirmSwapDialogComponent, {
          autoFocus: false,
          backdropClass: this.dialogBackdropColorClass,
          panelClass: this.dialogPanelClass,
          disableClose: true,
          data: {
            type: this.walletReceiveAsset.type,
            sourceAsset: this.assetIn,
            targetAsset: this.assetOut,
            networkFeeIn: this.networkFeeIn,
            networkFeeOut: this.networkFeeOut,
            basePrice: this.basePrice,
            inputValue: this.assetUnitIn,
            outputValue: this.assetUnitOut.value,
            targetAddress: this.walletReceiveAsset.address,
            sourceAddress: this.walletSendAsset.address,
            slip: this.slip,
            balanceIn: this.balanceIn ? bn(this.balanceIn) : bn(0),
            balanceOut: this.balanceOut ? bn(this.balanceOut) : bn(0),
            user: user,
            isSP: false,
          },
        });

        dialogRef.afterClosed().subscribe((data) => {
          this.clean();
          this.isComplete.emit(true);
        });
      }
    });
  }

  SPswap() {
    const forgetDialogRef =
      this.walletSendAsset.type === 'keystore'
        ? this.dialog.open(ConfirmKeystorePasswordComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { swapConfirmed: this.swapConfirmed },
          })
        : this.dialog.open(ConfirmDialogComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { swapConfirmed: this.swapConfirmed },
          });

    forgetDialogRef.afterClosed().subscribe((data) => {
      if (data.yes === true) {
        consoleLog(this.spDataRes);
        const user = this.user.filter(
          (u) => u.type == this.walletSendAsset.type
        )[0];
        const dialogRef = this.dialog.open<
          ConfirmSwapDialogComponent,
          SwapData
        >(ConfirmSwapDialogComponent, {
          autoFocus: false,
          backdropClass: this.dialogBackdropColorClass,
          panelClass: this.dialogPanelClass,
          disableClose: true,
          data: {
            type: this.walletReceiveAsset.type,
            sourceAsset: this.assetIn,
            targetAsset: this.assetOut,
            networkFeeIn: this.networkFeeIn,
            networkFeeOut: this.networkFeeOut,
            basePrice: this.basePrice,
            inputValue: this.spDataRes.amount_division,
            outputValue: this.assetUnitOut.value,
            targetAddress: this.walletReceiveAsset.address,
            sourceAddress: this.walletSendAsset.address,
            slip: this.slip,
            balanceIn: this.balanceIn ? bn(this.balanceIn) : bn(0),
            balanceOut: this.balanceOut ? bn(this.balanceOut) : bn(0),
            user: user,
            isSP: true,
            spQty: this.spDataRes.division_transaction,
          },
        });

        dialogRef.afterClosed().subscribe((data) => {
          this.clean();
          this.isComplete.emit(true);
        });
      }
    });
  }

  clean() {
    this.showConfirm = false;
    this.swapIsValid = false;
    this.assetUnitInPerc = 0;
    this.updateAssetUnits(0);
  }

  toogleFeeDetails() {
    this.showFeeDetails = this.showFeeDetails == false ? true : false;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
    this.operationsService.setAssetOut(new Asset('THOR.RUNE'));
  }

  getFeeClass(slip: number) {
    let slipClass = '';
    slip * 100 >= 5 ? (slipClass = 'fee-item red') : (slipClass = 'fee-item');
    return slipClass;
  }

  addRecieveWallet(chain: string) {
    const dialogRef = this.dialog.open(RecieveWalletComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: { chain, walletRecieve: this.walletReceiveAsset },
    });

    dialogRef.afterClosed().subscribe((recieveWallet: WalletData) => {
      if (recieveWallet != null) {
        this.operationsService.setWalletRecieve(recieveWallet);
        this.operationsService.setWalletRecieveType(recieveWallet.type);
      }
    });
  }

  getSwapBtnClass() {
    if (this.swapIsValid == true && this.hasWallet == true) {
      return 'swap-button';
    } else {
      return 'swap-button blocked';
    }
  }
}

function getPrecision(num: number): number {
  let numAsStr = num.toFixed(10); //number can be presented in exponential format, avoid it
  numAsStr = numAsStr.replace(/0+$/g, '');

  const precision =
    String(numAsStr).replace('.', '').length - num.toFixed().length;
  return precision;
}
