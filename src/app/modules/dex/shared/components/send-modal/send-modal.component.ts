import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

// DEPENDENCIES
import { combineLatest, Subscription, timer } from 'rxjs';
import { delay, retryWhen, switchMap, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// XCHAINS
import {
  assetToString,
  bn,
  BaseAmount,
  assetToBase,
  assetAmount,
} from '@xchainjs/xchain-util';

// CLASES
import { Asset } from '@dexShared/classes/asset';
import { PoolAddressDTO } from '@dexShared/classes/pool-address';
import { User, WalletType } from '@dexShared/classes/user';

// DIALOGS
import { ConfirmDialogComponent } from '@dexShared/dialogs/confirm-dialog/confirm-dialog.component';
import { AssetsDialogComponent } from '@dexShared/dialogs/assets-dialog/assets-dialog.component';
import { ConfirmKeystorePasswordComponent } from '@dexShared/dialogs/confirm-keystore-password/confirm-keystore-password.component';
import {
  ConfirmSendData,
  ConfirmSendDialogComponent,
} from './confirm-send-dialog/confirm-send-dialog.component';

// INTERFACES
import { AssetBalance } from '@dexShared/interfaces/asset-balance';
import {
  WalletData,
  MidgardPool,
  Stats,
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

export interface currencyOptions {
  align: string;
  prefix: string;
  suffix: string;
  thousands: string;
  decimal: string;
  allowNegative: boolean;
  precision: number;
  nullable: boolean;
  min: number;
  max: any;
  inputMode: CurrencyMaskInputMode;
}
@Component({
  selector: 'app-send-modal',
  templateUrl: './send-modal.component.html',
  styleUrls: ['./send-modal.component.scss'],
})
export class SendModalComponent implements OnInit, OnDestroy {
  @Input() type: 'send';
  walletSendAsset: WalletData;

  walletType: WalletType;

  @Output() isDisabled = new EventEmitter<boolean>();
  @Output() isComplete = new EventEmitter<boolean>();

  public assetBalances: AssetBalance[];

  public maxInValue = 1000;
  public minInValue = 0;

  public assetUnitInPerc: number = 0;
  public totalFeeUSD: number = 0;
  public assetUnitIn: number = 0;
  public assetUnitInLabel: string = '0.00';
  public recipientInput: string = '';
  public memoInput: string = '';
  public assetUnitInHint: string;
  public rune = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE'; //'RUNE-67C'
  public bnb = 'BNB';
  private inboundAddresses: PoolAddressDTO[];
  public subs: Subscription[] = [];
  public user: User[];
  public basePrice: number = 0;
  public assetTokenValueIn: BaseAmount;
  public calculatingTargetAsset: boolean;

  // COLOR THEME
  public themeValue = '';
  public dialogPanelClass: string;
  public dialogBackdropColorClass: string;

  // POOL STUFF
  public availablePools: PoolDTO[];
  public poolDetailMap: { [key: string]: PoolDTO } = {};
  public poolDetailOutError: boolean;
  public poolDetailInError: boolean;
  private haltedChains: string[];

  public inputUsdValueIn: number = 0;

  public showFeeDetails: boolean = false;

  public originalPools: MidgardPool[];
  public originalStats: Stats;
  public runePriceUSD: number;

  // ASSETS STUFF
  public assetIn: Asset = new Asset(`BNB.${this.bnb}`); //default
  public assetUnitInUSD: string;

  // BALANCES STUFF
  public balanceIn: number;
  public balanceInUSD: number;
  public hintIn: string = '0';

  // FEE
  private inboundFees: { [key: string]: number } = {};
  public networkFeeIn: number;

  // CONFIRMATIONS
  public hasWallet: boolean;
  public swapIsValid: boolean = false;
  public showConfirm: boolean;
  public swapConfirmed: boolean = false; // TO SEE
  public isValidRecipentValue: boolean;

  public assetUnitInForm: FormGroup;
  public amountOptions: currencyOptions = {
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
    inputMode: CurrencyMaskInputMode.NATURAL,
  };

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
    this.subs = [
      user$,
      // slippageTolerange$
    ];
  }

  ngOnInit() {
    this.assetUnitInForm = this.formBuilder.group({
      amount: [''],
    });
    ///////////////
    let walletSendSub = this.operationsService.walletSend$.subscribe(
      (walletSend) => {
        this.walletSendAsset = walletSend;
        if (this.walletSendAsset) {
          this.hasWallet = true;
        } else {
          this.hasWallet = false;
        }

        let assetInSub = this.operationsService.assetIn$.subscribe(
          (assetIn) => {
            // REASSING ASSETS DEPENDING OF THE SELECTED TOKEN
            this.assetIn = assetIn;
            let walletBalance = this.walletSendAsset?.balance;
            let tempBalance = 0;
            for (let i = 0; i < walletBalance.length; i++) {
              consoleLog(walletBalance[i]);
              if (
                this.assetIn.chain != 'ETH' &&
                walletBalance[i].asset?.toLocaleUpperCase() ==
                  this.assetIn.symbol?.toLocaleUpperCase()
              ) {
                walletBalance[i].asset == 'BCH' ||
                walletBalance[i].asset == 'rune'
                  ? (tempBalance = walletBalance[i].amount / 100000000)
                  : (tempBalance = walletBalance[i].amount);

                let precision = getPrecision(+tempBalance);
                this.amountOptions.precision = precision == 0 ? 4 : precision;
                this.amountOptions.max = +tempBalance;

                this.balanceIn = tempBalance;
              } else if (this.assetIn.chain == 'ETH') {
                let walletAsset = new Asset(walletBalance[i].asset);
                consoleLog(walletAsset, this.assetIn);
                if (walletAsset.symbol === this.assetIn.symbol) {
                  tempBalance = walletBalance[i].amount / Math.pow(10, 18);
                  let precision = getPrecision(+tempBalance);
                  this.amountOptions.precision = precision == 0 ? 4 : precision;
                  this.amountOptions.max = +tempBalance;
                }
                this.balanceIn = tempBalance;
              }
            }

            this.assestUsdPriceService
              .calUsdPrice(this.balanceIn, this.assetIn.fullname)
              .then((usd) => {
                this.balanceInUSD = usd;
              });
          }
        );

        this.subs.push(assetInSub);
      }
    );

    let originalStatsSub =
      this.masterWalletBalanceService.originalStats$.subscribe((stats) => {
        if (stats != null) {
          this.runePriceUSD = +stats.runePriceUSD;
          this.originalStats = stats;
        }
      });

    let originalPoolsSub = this.masterWalletBalanceService
      .getOriginalPools()
      .subscribe((pools) => {
        if (pools != null) {
          this.originalPools = pools;
        }
      });

    this.getBalances();

    const inboundAddresses$ = this.midgardService.getInboundAddresses();
    const pools$ = this.midgardService.getPools();
    const combined = combineLatest([inboundAddresses$, pools$]);

    const sub = timer(0, 30000)
      .pipe(
        switchMap(() => combined),
        retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(([inboundAddresses, pools]) => {
        this.inboundAddresses = inboundAddresses;

        // check for halted chains
        this.setHaltedChains();

        this.setAvailablePools(pools);

        // update network fees
        this.setNetworkFees();
      });

    //include all subcriptions for deleting on destroy event
    this.subs.push(
      sub,
      walletSendSub,
      //walletRecieveSub,
      //assetOutSub,
      originalStatsSub,
      originalPoolsSub
    );

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

  // INIT STUFFS
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

      const assetInboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'INBOUND',
        pool
      );

      this.inboundFees[pool.asset] = assetInboundFee;
    }

    this.inboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'INBOUND'
    );

    const inboundFee =
      this.assetIn.chain === 'ETH'
        ? this.inboundFees['ETH.ETH']
        : this.assetIn.chain === 'BNB'
        ? this.inboundFees['BNB.BNB']
        : this.inboundFees[assetToString(this.assetIn)];

    this.networkFeeIn = inboundFee;
    this.totalFeeUSD = this.getTotalFeeUSD();
  }

  async getBalances() {
    let walletBalance = this.walletSendAsset?.balance;
    let tempBalance = 0;
    if (walletBalance) {
      for (let i = 0; i < walletBalance.length; i++) {
        if (walletBalance[i].asset == this.assetIn.symbol) {
          walletBalance[i].asset == 'BCH' || walletBalance[i].asset == 'rune'
            ? (tempBalance = walletBalance[i].amount / 100000000)
            : (tempBalance = walletBalance[i].amount);

          this.balanceIn = tempBalance;
        }
      }

      this.balanceInUSD = await this.assestUsdPriceService.calUsdPrice(
        this.balanceIn,
        this.assetIn.fullname
      );
    }
  }

  // ASSETS STUFFS

  setAsset(field: string) {
    let selectedToken = this.assetIn.ticker;

    const dialogRef = this.dialog.open(AssetsDialogComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: { field, disabledAssetSymbol: selectedToken, type: 'swap' },
    });

    dialogRef.afterClosed().subscribe((selection) => {
      let value = 0;
      if (selection !== undefined) {
        this.assetIn = selection.item.asset;
        this.operationsService.setAssetIn(this.assetIn);
        this.updateAssetUnits('0.00');
        value = 0;
        this.assetUnitInPerc = 0;
        this.swapIsValid = false;

        this.updateAssetUnits(value);

        if (this.assetUnitIn > this.balanceIn) {
          this.assetUnitIn = this.balanceIn;
          this.assetUnitInPerc = 100;
          this.swapIsValid = false;
        }

        this.setNetworkFees();
      }
    });
  }

  getPoolDetails(chain: string, symbol: string, type: 'in' | 'out') {
    if (chain == 'THOR') {
      return;
    }
    this.poolDetailOutError = type === 'out' ? false : this.poolDetailOutError;
    this.poolDetailInError = type === 'in' ? false : this.poolDetailInError;

    let pool = this.originalPools.filter((pool) =>
      pool.asset.name.startsWith(`${chain}.${symbol}`)
    )[0];

    this.midgardService.getPoolDetails(`${pool.asset.name}`).subscribe(
      (res) => {
        if (res) {
          this.poolDetailMap[symbol] = res;
          this.getTotalFeeUSD();
          this.getUSDValues();
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

  setMax() {
    if (this.balanceIn !== undefined && this.balanceIn !== 0) {
      this.updateAssetUnits(this.balanceIn);
    } else {
      this.updateAssetUnits(this.maxInValue, 100);
    }
    this.assetUnitInPerc = 100;
  }

  calculateAssetUnits(perc: number) {
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
    let input: string = '0';

    if (typeof val === 'string' || val instanceof String) {
      input = val.replace(/[^0-9\.]+/g, '');
    } else {
      input = val;
    }
    let inputNumber = Number(input);

    if (this.balanceIn !== 0 && inputNumber > this.balanceIn) {
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
    this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
    this.swapIsValid =
      this.assetUnitIn > 0 && this.assetUnitIn <= this.balanceIn ? true : false;
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
      })[0]?.asset_price_usd;
    }

    let totalFeeUSD = this.networkFeeIn * assetInUSDPrice;
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

    this.inputUsdValueIn = this.assetUnitIn * assetInUSDPrice;
  }

  // SWAP STUFFS

  confirmSend() {
    if (this.swapIsValid == true) {
      if (this.assetIn && this.assetUnitIn > 0 && this.isValidRecipentValue) {
        this.showConfirm = true;
        this.isDisabled.emit(true);
      }
    }
  }

  // CONTROLS
  backSend() {
    this.showConfirm = false;
    this.isDisabled.emit(false);
  }

  send() {
    const forgetDialogRef =
      this.walletSendAsset.type == 'keystore'
        ? this.dialog.open(ConfirmKeystorePasswordComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { confirmed: this.showConfirm },
          })
        : this.dialog.open(ConfirmDialogComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { swapConfirmed: this.showConfirm },
          });

    forgetDialogRef.afterClosed().subscribe((data) => {
      if (data.yes === true) {
        let user = this.user.filter(
          (u) => u.type == this.walletSendAsset.type
        )[0];
        const dialogRef = this.dialog.open<
          ConfirmSendDialogComponent,
          ConfirmSendData
        >(ConfirmSendDialogComponent, {
          autoFocus: false,
          backdropClass: this.dialogBackdropColorClass,
          panelClass: this.dialogPanelClass,
          disableClose: true,
          data: {
            type: this.walletSendAsset.type,
            sourceAsset: this.assetIn,
            networkFeeIn: this.networkFeeIn,
            inputValue: this.assetUnitIn,
            targetAddress: this.recipientInput,
            memo: this.memoInput,
            balanceIn: this.balanceIn ? bn(this.balanceIn) : bn(0),
            user: user,
          },
        });

        dialogRef.afterClosed().subscribe((data) => {
          this.clean();
          this.isComplete.emit(true);
        });
      }
    });
  }

  isValidRecipent(address: string) {
    let walletData = this.masterWalletBalanceService.createWalletData(
      address,
      this.walletSendAsset.type
    );
    consoleLog(address, walletData);
    if (
      walletData.chain == this.walletSendAsset.chain &&
      address != this.walletSendAsset.address
    ) {
      this.isValidRecipentValue = true;
      this.swapIsValid = true;
    } else {
      this.isValidRecipentValue = false;
      this.swapIsValid = false;
    }
  }

  clean() {
    this.showConfirm = false;
    this.swapIsValid = false;
    this.assetUnitInPerc = 0;
    this.memoInput = '';
    this.recipientInput = '';
    this.updateAssetUnits(0);
  }

  toogleFeeDetails() {
    this.showFeeDetails = this.showFeeDetails == false ? true : false;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  getFeeClass(slip: number) {
    let slipClass = '';
    slip * 100 >= 5 ? (slipClass = 'fee-item red') : (slipClass = 'fee-item');
    return slipClass;
  }

  getSwapBtnClass() {
    if (
      this.swapIsValid == true &&
      this.hasWallet == true &&
      this.assetUnitIn > 0 &&
      this.isValidRecipentValue
    ) {
      return 'swap-button';
    } else {
      return 'swap-button blocked';
    }
  }
}

function getPrecision(num: number) {
  let numAsStr = num.toFixed(10); //number can be presented in exponential format, avoid it
  numAsStr = numAsStr.replace(/0+$/g, '');

  const precision =
    String(numAsStr).replace('.', '').length - num.toFixed().length;
  return precision;
}
