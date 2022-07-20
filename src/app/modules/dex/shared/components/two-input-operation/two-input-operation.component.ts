import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

// CLASES
import { Asset } from '@dexShared/classes/asset';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

interface iUpdateAssetUnits {
  inputValue: number;
  isRune: boolean;
  name?: 'send' | 'received';
}

@Component({
  selector: 'app-two-input-operation',
  templateUrl: './two-input-operation.component.html',
  styleUrls: ['./two-input-operation.component.scss'],
})
export class TwoInputOperationComponent implements OnInit {
  @Input() operation: 'add' | 'swap' | 'pending' | 'manage' | 'withdraw';
  @Input() assetSelected: Asset;

  @Input() assetIn: Asset;
  @Input() assetOut: Asset;
  @Input() assetUnitIn: FormControl;
  @Input() assetUnitOut: FormControl;
  @Input() inputUsdValueIn: string = '$0.00';
  @Input() inputUsdValueOut: string = '$0.00';

  @Input() slip: number | string;
  @Input() poolShareEst: string;
  @Input() poolShare: string;

  @Input() networkFeeIn: number;
  @Input() networkFeeOut: number;
  @Input() totalFeeToUSD: number;
  @Input() LPUnits: string;

  @Input() balanceIn: number;
  @Input() balanceInUSD: number;
  @Input() balanceOut: number;
  @Input() balanceOutUSD: number;

  @Input() addIsValid: boolean;
  @Input() hasWallet: boolean;

  @Output() inputValue: EventEmitter<iUpdateAssetUnits> = new EventEmitter();
  @Output() percent: EventEmitter<number> = new EventEmitter();
  @Output() setAssetValue: EventEmitter<'in' | 'out'> = new EventEmitter();
  @Output() setMaxFunction: EventEmitter<any> = new EventEmitter();
  @Output() setConfirmation: EventEmitter<any> = new EventEmitter();

  public runeSelected = new Asset('THOR.RUNE');
  public showFeeDetails: boolean = false;

  public language: string;
  public translation: any;

  constructor(private masterWalletManagerService: MasterWalletManagerService, public translate: TranslateService) {}

  ngOnInit(): void {
    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  setAsset(type: 'in' | 'out') {
    this.setAssetValue.emit(type);
  }

  setPercent($event: any) {
    this.percent.emit($event);
  }

  setMax() {
    this.setMaxFunction.emit();
  }

  inputValueComing(res: iUpdateAssetUnits) {
    this.inputValue.emit(res);
  }

  confirm() {
    this.setConfirmation.emit();
  }

  toogleFeeDetails() {
    this.showFeeDetails = this.showFeeDetails == false ? true : false;
  }

  getFeeClass(slip: number | string) {
    let slipClass = '';
    +slip * 100 >= 5 ? (slipClass = 'fee-item red') : (slipClass = 'fee-item');
    return slipClass;
  }

  getSwapBtnClass() {
    let restIn = this.assetUnitIn.value - this.networkFeeIn;
    let restOut = this.assetUnitOut.value - this.networkFeeOut;
    if (
      this.addIsValid == true &&
      this.hasWallet == true &&
      this.balanceIn > 0 &&
      this.balanceOut > 0 &&
      restIn > 0 &&
      restOut > 0
    ) {
      return 'swap-button';
    } else {
      return 'swap-button blocked';
    }
  }
}
