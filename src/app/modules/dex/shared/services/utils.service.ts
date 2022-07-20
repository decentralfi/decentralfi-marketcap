import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  getAssetName(assetName: string): string {
    const nameArray = assetName.split('-');
    const name = nameArray[0].split('.');
    return name[1] === undefined ? name.toString() : name[1].toString();
  }

  addCurrentSign(sign: string, value: string, position: number = 1): string {
    if (position === 0 && value.indexOf('-') === -1) {
      //consoleLog('no match');
      return sign + value;
    } else {
      const mathSign = value.slice(0, 1);
      const numberString = value.slice(1);
      return mathSign + sign + numberString;
    }
  }

  toString(
    baseTicker: string,
    value: BigNumber,
    needPrefix: boolean = false,
    pool: string = '',
    needBase: boolean = true,
    isPrice: boolean = false,
    isUSD: boolean = false
  ): string {
    let prefix = '';
    //  consoleLog(value);
    if (needPrefix && value.isGreaterThan(0)) {
      prefix = '+';
    }

    let decimal = 3;
    if (baseTicker === 'BUSD' && isPrice) {
      decimal = 2;
    } else if (isUSD) {
      decimal = 2;
    } else if (pool === 'BNB.BULL-BE4' || pool === 'BNB.BTCB-1DE') {
      if (baseTicker === 'ASSET') {
        decimal = 5;
      } else if (!isPrice) {
        decimal = 5;
      }
    }

    if (needBase) {
      return prefix + value.div(environment.BNB_BASE_NUMBER).toFormat(decimal);
    } else {
      return prefix + value.toFormat(decimal);
    }
  }
}
