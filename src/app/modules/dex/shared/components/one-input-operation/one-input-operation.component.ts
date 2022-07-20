import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CurrencyMaskInputMode } from 'ngx-currency';

// CLASES
import { Asset } from '@dexShared/classes/asset';

// SERVICES
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';

// CONSTANTS
import { PoolTypeOption } from '@dexShared/constants/pool-type-options';

import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

interface iUpdateAssetUnits {
  inputValue: number;
  isRune: boolean;
  name?: 'send' | 'received';
}

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
  selector: 'app-one-input-operation',
  templateUrl: './one-input-operation.component.html',
  styleUrls: ['./one-input-operation.component.scss'],
})
export class OneInputOperationComponent implements OnInit {
  @Input() operation: 'add' | 'swap' | 'pending' | 'manage' | 'withdraw';
  @Input() name: 'send' | 'received' = 'send';
  @Input() onlyForm: boolean = false;
  @Input() tokenSelected: Asset;
  @Input() type: PoolTypeOption = 'SYM';

  @Input() asset: Asset;
  @Input() assetUnit: FormControl;
  @Input() inputUsdValue: string = '$0.00';

  @Input() slip: number | string;
  @Input() poolShareEst: string;
  @Input() poolShare: string;

  @Input() networkFee: number;
  @Input() feeToUsdValue: number;

  @Input() maxInValue?: number = 1000;
  @Input() balance: number = 0;
  @Input() balanceUSD: number;

  @Input() LPUnits: string;

  @Output() inputValue: EventEmitter<iUpdateAssetUnits> = new EventEmitter();
  @Output() percent: EventEmitter<number> = new EventEmitter();
  @Output() setAssetValue: EventEmitter<'in' | 'out'> = new EventEmitter();
  @Output() setMaxFunction: EventEmitter<any> = new EventEmitter();
  @Output() setConfirmation: EventEmitter<any> = new EventEmitter();

  @Input() addIsValid: boolean;
  @Input() hasWallet: boolean;

  public value: number = 0;
  // public percentage: number = 0;

  public subs: Subscription[] = [];
  public showFeeDetails: boolean = false;

  public inputOptions: currencyOptions = {
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

  public language: string;
  public translation: any;

  constructor(private operationsService: MarketcapOperationsService,private masterWalletManagerService: MasterWalletManagerService, public translate: TranslateService) {}

  ngOnInit(): void {
    this.inputOptions.max = this.maxInValue;
    this.inputOptions.prefix = this.asset.ticker + ' ';
    if (this.inputUsdValue === undefined) {
      this.inputUsdValue = '$0.00';
    }
    let poolInSub = this.operationsService.assetIn$.subscribe((asset) => {
      if (asset !== null) {
        if (this.tokenSelected === undefined) {
          this.tokenSelected = asset;
        }
      }
    });

    if (this.balance > 0) {
      let precision = getPrecision(this.balance);
      this.inputOptions.precision = precision;
      this.inputOptions.max = this.balance;
    } else {
      this.inputOptions.precision = 4;
      this.inputOptions.max = undefined;
    }

    this.subs.push(poolInSub);

    this.assetUnit.valueChanges
      .pipe(
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe((val) => {
        if (this.name === 'send') {
          this.inputValue.emit({
            inputValue: val,
            isRune: false,
            name: this.name,
          });
        } else if (this.name === 'received' && this.type == 'ASYM_RUNE') {
          this.inputValue.emit({
            inputValue: val,
            isRune: true,
            name: this.name,
          });
        }

        /**/
        let result = 0;
        if (this.balance > 0) {
          result = (val * 100) / this.balance;
        } else {
          result = (val * 100) / this.maxInValue;
        }

        this.percent.emit(result);
        this.value = result;
        /**/
      });

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  setAsset() {
    if (this.name === 'send' && this.operation != 'withdraw') {
      this.setAssetValue.emit('in');
    }
  }

  toogleFeeDetails() {
    this.showFeeDetails = this.showFeeDetails == false ? true : false;
  }

  setMax() {
    let val = 0;
    let isRune;
    if (this.balance > 0) {
      val = this.balance;
    } else {
      val = this.maxInValue;
    }
    if (this.name === 'send') {
      isRune = false;
    } else if (this.name === 'received' && this.type == 'ASYM_RUNE') {
      isRune = false;
    }
    this.inputValue.emit({
      inputValue: val,
      isRune: isRune,
      name: this.name,
    });
    this.setMaxFunction.emit();
    this.percent.emit(100);
    this.value = 100;
  }

  confirmAdd() {
    this.setConfirmation.emit();
  }

  formatLabel(value: number) {
    return value + '%';
  }

  getFeeClass(slip: number | string) {
    let slipClass = '';
    +slip * 100 >= 5 ? (slipClass = 'fee-item red') : (slipClass = 'fee-item');
    return slipClass;
  }

  calculateAssetUnits(perc: number) {
    let result = 0;
    if (this.balance) {
      result = (this.balance * perc) / 100;
    } else {
      result = (this.maxInValue * perc) / 100;
    }

    this.percent.emit(perc);
    this.assetUnit.setValue(result);
    // consoleLog(result, perc, this.value, this.balance, this.maxInValue);
  }

  getSwapBtnClass() {
    if (this.operation == 'withdraw') {
      if (this.addIsValid == true && this.hasWallet == true) {
        return 'swap-button';
      } else {
        return 'swap-button blocked';
      }
    } else {
      let rest = this.assetUnit.value - this.networkFee;
      if (
        this.addIsValid == true &&
        this.hasWallet == true &&
        this.balance > 0 &&
        rest > 0
      ) {
        return 'swap-button';
      } else {
        return 'swap-button blocked';
      }
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}

function getPrecision(num: any) {
  let strBalance = typeof num == 'string' ? num : num.toString();
  let numAsStr = strBalance.split('.');
  let precision = numAsStr.length > 1 ? numAsStr[1].length : 8;

  return precision;
}
