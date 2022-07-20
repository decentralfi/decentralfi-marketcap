import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import BigNumber from 'bignumber.js';
import {
  LPTotals,
  Resume,
  pieSerie,
  liquidityAssetAmount,
} from '../interfaces/liquidity';
import { AssetBalance } from '../interfaces/asset-balance';
import { AssetDetail } from '../interfaces/models/assetDetail';
import { RoundedValuePipe } from '../pipes/rounded-value.pipe';
import { faWindowRestore } from '@fortawesome/free-solid-svg-icons';

@Injectable({
  providedIn: 'root',
})
export class LiquidityService {
  constructor(
    private http: HttpClient,
    private roundedPipe: RoundedValuePipe
  ) {}

  private endpointUrl = environment.endpoint;

  /** LP History tracking for liquidity module*/

  public StakeTrackingHistory(wallet: string) {
    return this.http.get(
      this.endpointUrl + 'history/tracking_staked/address/' + wallet + '/'
    );
  }

  public StakeTrackingHistoryTotal(wallet: string) {
    return this.http.get(
      this.endpointUrl + 'history/tracking_staked_total/address/' + wallet + '/'
    );
  }

  getResume(
    summary: any,
    currency: string,
    balance: AssetBalance[],
    busdPrice: BigNumber,
    walletPrice: AssetDetail[],
    showHideToggle: boolean
  ): Observable<Resume> {
    let totalStaked = new BigNumber(0);
    let totalCurrentPool = new BigNumber(0);
    let totalWithdrawnPool = new BigNumber(0);
    let resume: Resume;
    let piePalette = [
      'rgba(178, 223, 138, 1)',
      'rgba(31, 120, 180, 1)',
      'rgba(51, 160, 44, 1)',
      'rgba(166, 206, 227, 1)',
      'rgba(118, 118, 118, 1)',
    ];

    let assetAmount: liquidityAssetAmount[] = [];

    let totalDpy: number = 0;

    for (let i = 0; i < summary.length; i++) {
      let dpy = this.getDpy(
        summary[i].original.time,
        summary[i].profit.percentageNumber
      );
      totalDpy = totalDpy + dpy;

      if (currency != 'RUNE') {
        totalStaked = totalStaked.plus(
          summary[i].original.stake.newtotalBUSDAmount
        );
        totalWithdrawnPool = totalWithdrawnPool.plus(
          summary[i].original.withdraw.newtotalBUSDAmount
        );
        totalCurrentPool = totalCurrentPool.plus(
          summary[i].currentShare.stake.totalBUSDAmount.toNumber()
        );

        assetAmount.push({
          asset: summary[i].pool,
          amount: summary[i].currentShare.stake.totalBUSDAmount.div(100000000),
        });
      } else {
        totalStaked = totalStaked.plus(summary[i].profit.totalStake);
        totalWithdrawnPool = totalWithdrawnPool.plus(
          summary[i].profit.totalWithdraw
        );
        totalCurrentPool = totalCurrentPool.plus(summary[i].profit.totalPool);

        assetAmount.push({
          asset: summary[i].pool,
          amount: summary[i].profit.totalPool.div(100000000),
        });
      }
    }

    let totalGainLoss = +totalCurrentPool.toString() - +totalStaked.toString();
    let totalGainLossPerc = (totalGainLoss * 100) / +totalStaked.toString();

    //let apy = this.calculateAPY(summary[0].original.time, new BigNumber(totalGainLossPerc));
    let apy = +(totalDpy * 365).toFixed(2);
    let apw = +(apy / 52).toFixed(2);
    let apd = +(apy / 365).toFixed(2);

    let totalWallet = new BigNumber(0);
    let totalWalletLP = new BigNumber(0);
    totalWalletLP = totalWalletLP.plus(totalCurrentPool.div(100000000));

    let n = 0;
    for (let i = 0; i < balance.length; i++) {
      if (currency == 'RUNE') {
        if (balance[i].asset == 'RUNE-B1A') {
          totalWalletLP = totalWalletLP.plus(balance[i].assetValue.amount());
          totalWallet = totalWallet.plus(balance[i].assetValue.amount());
        } else {
          let assetRuneAmount = this.getAssetRuneAmount(
            walletPrice,
            balance[i]
          );
          totalWalletLP = totalWalletLP.plus(assetRuneAmount);
          totalWallet = totalWallet.plus(assetRuneAmount);
        }
      } else {
        if (balance[i].asset == 'RUNE-B1A') {
          let runeBalance = balance[i].assetValue.amount();
          totalWalletLP = totalWalletLP.plus(runeBalance.div(busdPrice));
          totalWallet = totalWallet.plus(runeBalance.div(busdPrice));
        } else {
          let assetRuneAmount = this.getAssetRuneAmount(
            walletPrice,
            balance[i]
          );
          totalWalletLP = totalWalletLP.plus(assetRuneAmount.div(busdPrice));
          totalWallet = totalWallet.plus(assetRuneAmount.div(busdPrice));
        }
      }
    }

    let assetOLPPerc = totalWallet.multipliedBy(100).div(totalWalletLP);

    let pieAssets: pieSerie[] = [];
    for (let x = 0; x < assetAmount.length; x++) {
      let assetPerc = assetAmount[x].amount
        .multipliedBy(100)
        .div(totalWalletLP);
      let Amount = this.roundedPipe.transform(assetAmount[x].amount.toNumber());
      showHideToggle == true ? (Amount = Amount) : (Amount = '******');
      let pieAsset: pieSerie = {
        value: +assetPerc.toFixed(2),
        name:
          this.getAssetName(assetAmount[x].asset) +
          ' (' +
          +assetPerc.toFixed(2) +
          '%) Pool ' +
          Amount +
          this.getSimbol(currency, true),
        itemStyle: { color: '' },
      };

      pieAssets.push(pieAsset);
    }

    let OLPAmount = this.roundedPipe.transform(totalWallet.toNumber());
    showHideToggle == true ? (OLPAmount = OLPAmount) : (OLPAmount = '******');
    let pieOLP: pieSerie = {
      value: +assetOLPPerc.toFixed(2),
      name:
        'Assets Outside LP (' +
        assetOLPPerc.toFixed(2) +
        '%) ' +
        OLPAmount +
        this.getSimbol(currency, true),
      itemStyle: { color: '' },
    };

    let pie: pieSerie[] = [];

    pie = pieAssets;
    pie.push(pieOLP);

    for (let z = 0; z < pie.length; z++) {
      if (z < piePalette.length) {
        pie[z].itemStyle.color = piePalette[z];
      } else {
        pie[z].itemStyle = {};
      }
    }

    resume = {
      totalWallet: totalWalletLP,
      totalLPPerc: new BigNumber(100).minus(assetOLPPerc),
      apy: apy,
      apw: apw,
      apd: apd,
      pie: pie,
    };

    return of(resume);
  }

  getNonLPResume(
    currency: string,
    balance: AssetBalance[],
    busdPrice: BigNumber,
    walletPrice: AssetDetail[],
    showHideToggle: boolean
  ): Observable<Resume> {
    let resume: Resume;
    let piePalette = [
      'rgba(178, 223, 138, 1)',
      'rgba(31, 120, 180, 1)',
      'rgba(51, 160, 44, 1)',
      'rgba(166, 206, 227, 1)',
      'rgba(118, 118, 118, 1)',
    ];

    let assetAmount: liquidityAssetAmount[] = [];

    let totalWalletLP = new BigNumber(0);
    let pie: pieSerie[] = [];

    for (let i = 0; i < balance.length; i++) {
      if (currency == 'RUNE') {
        if (balance[i].asset == 'RUNE-B1A') {
          totalWalletLP = totalWalletLP.plus(balance[i].assetValue.amount());
          assetAmount.push({
            asset: balance[i].asset,
            amount: balance[i].assetValue.amount(),
          });
        } else {
          let assetRuneAmount = this.getAssetRuneAmount(
            walletPrice,
            balance[i]
          );
          totalWalletLP = totalWalletLP.plus(assetRuneAmount);
          assetAmount.push({
            asset: balance[i].asset,
            amount: assetRuneAmount,
          });
        }
      } else {
        if (balance[i].asset == 'RUNE-B1A') {
          let runeBalance = balance[i].assetValue.amount();
          totalWalletLP = totalWalletLP.plus(runeBalance.div(busdPrice));
          assetAmount.push({
            asset: balance[i].asset,
            amount: runeBalance.div(busdPrice),
          });
        } else {
          let assetRuneAmount = this.getAssetRuneAmount(
            walletPrice,
            balance[i]
          );
          totalWalletLP = totalWalletLP.plus(assetRuneAmount.div(busdPrice));
          assetAmount.push({
            asset: balance[i].asset,
            amount: assetRuneAmount.div(busdPrice),
          });
        }
      }
    }

    let pieAssets: pieSerie[] = [];
    for (let x = 0; x < assetAmount.length; x++) {
      let assetPerc = assetAmount[x].amount
        .multipliedBy(100)
        .div(totalWalletLP);
      let Amount = this.roundedPipe.transform(assetAmount[x].amount.toNumber());
      showHideToggle == true ? (Amount = Amount) : (Amount = '******');
      let pieAsset: pieSerie = {
        value: +assetPerc.toFixed(2),
        name:
          this.getAssetName(assetAmount[x].asset) +
          ' (' +
          +assetPerc.toFixed(2) +
          '%) ' +
          Amount +
          this.getSimbol(currency, true),
        itemStyle: { color: '' },
      };

      pieAssets.push(pieAsset);
    }

    pie = pieAssets;

    for (let z = 0; z < pie.length; z++) {
      if (z < piePalette.length) {
        pie[z].itemStyle.color = piePalette[z];
      } else {
        pie[z].itemStyle = {};
      }
    }

    resume = {
      totalWallet: totalWalletLP,
      totalLPPerc: new BigNumber(0),
      apy: 0,
      apw: 0,
      apd: 0,
      pie: pie,
    };

    return of(resume);
  }

  getAssetName(asset: string) {
    let chain: string;
    let symbol: string;
    let ticker: string;

    const data = asset.split('.');

    if (asset.includes('.')) {
      chain = data[0];
      symbol = data[1];
    } else {
      symbol = data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }

    return ticker;
  }

  getAssetRuneAmount(assetsPrice: AssetDetail[], balance: AssetBalance) {
    let asset = assetsPrice.filter(
      (asset) => asset.asset == 'BNB.' + balance.asset
    );
    let assetRuneAmount = new BigNumber(0);
    if (asset.length > 0) {
      let assetPrice = new BigNumber(asset[0].priceRune);
      let assetBalance = balance.assetValue.amount();
      assetRuneAmount = assetBalance.multipliedBy(assetPrice);
    }

    return assetRuneAmount;
  }

  getLPTotals(summary: any, currency: string): Observable<LPTotals> {
    let totalStaked = new BigNumber(0);
    let totalCurrentPool = new BigNumber(0);
    let totalWithdrawnPool = new BigNumber(0);
    let totalDpy: number = 0;

    for (let i = 0; i < summary.length; i++) {
      let dpy = this.getDpy(
        summary[i].original.time,
        summary[i].profit.percentageNumber
      );
      totalDpy = totalDpy + dpy;

      if (currency != 'RUNE') {
        totalStaked = totalStaked.plus(
          summary[i].original.stake.newtotalBUSDAmount
        );
        totalWithdrawnPool = totalWithdrawnPool.plus(
          summary[i].original.withdraw.newtotalBUSDAmount
        );
        totalCurrentPool = totalCurrentPool.plus(
          summary[i].currentShare.stake.totalBUSDAmount.toNumber()
        );
      } else {
        totalStaked = totalStaked.plus(summary[i].profit.totalStake);
        totalWithdrawnPool = totalWithdrawnPool.plus(
          summary[i].profit.totalWithdraw
        );
        totalCurrentPool = totalCurrentPool.plus(summary[i].profit.totalPool);
      }
    }

    let totalGainLoss =
      totalCurrentPool.toNumber() +
      totalWithdrawnPool.toNumber() -
      totalStaked.toNumber();
    //let totalGainLoss = (totalCurrentPool.toNumber() ) - totalStaked.toNumber();
    let totalGainLossPerc = (totalGainLoss * 100) / totalStaked.toNumber();
    let apy = this.calculateAPY(
      summary[0].original.time,
      new BigNumber(totalGainLossPerc)
    );

    let totals: LPTotals = {
      totalStaked: totalStaked,
      totalCurrent: totalCurrentPool,
      totalWithdrawn: totalWithdrawnPool,
      totalGainLoss: totalGainLoss,
      totalGainLossPerc: totalGainLossPerc,
      //apy: apy
      apy: +(totalDpy * 365).toFixed(2),
    };

    return of(totals);
  }

  getDpy(time: string, percentageNumber: number) {
    const dayCount = this.calculateTime(time);
    return percentageNumber / dayCount;
  }

  calculateAPY(time: string, percentageNumber: BigNumber) {
    const dayCount = this.calculateTime(time);
    /*if (dayCount < 7) {
    return {percent: 'LP vs HODL APY shows after 7 days', desc: '' }
  }*/
    let dayLimit = 0; // dayCount >= 14 ? 14 : 7;
    let maxLimit = 0;
    let base = 0;
    let apyTotal: number;

    if (dayCount >= 30) {
      dayLimit = 30;
      maxLimit = 12;
      base = 30;
    } else if (dayCount >= 14) {
      dayLimit = 14;
      maxLimit = 52;
      base = 7;
    } else {
      dayLimit = 7;
      maxLimit = 52;
      base = 7;
    }
    const periodic = dayCount / dayLimit;
    const periodicRatePercent = percentageNumber.div(periodic);
    const periodicRate = periodicRatePercent.div(100);
    const numberOfWeekOrMonth = new BigNumber(maxLimit).div(dayLimit / base);

    const apy = periodicRate
      .plus(1)
      .pow(numberOfWeekOrMonth.toNumber())
      .minus(1)
      .multipliedBy(100);

    //return apyTotal = +(apy.toFixed(2));
    return (apyTotal = +(
      (percentageNumber.toNumber() / dayCount) *
      365
    ).toFixed(2));
    /*this.apw = ((dayCount / percentageNumber.toNumber()) * 7).toFixed(2);
  this.apd = (dayCount / percentageNumber.toNumber()).toFixed(2);*/

    /*this.apy = apy.toFormat(2);
  this.apw = apy.div(52).toFormat(2);
  this.apd = apy.div(365).toFormat(2);*/

    /*const desc = `
  ${dayLimit} days-based APY:&#60;
  ${periodicRate.toFixed(2)} per ${dayLimit} days
  => APY = ${apy.toFormat(2) + '%'}
  `*/

    /*const desc2 = `
        <p><small>PL vs HOLD %</small></p>
        <p>≈ ${percentageNumber.toFixed(2)}% for ${dayCount} days</p>
        <p>⬇️</p>
          <p><small>${dayLimit} days-based %</small></p>
        <p>≈ ${periodicRatePercent.toFixed(2)}% per ${dayLimit} days
        <p>⬇️</p>
        <p><small>Estimated APY</small></p>
         <p>≈ ${apy.toFormat(2) + '%'}</p>

`;

  consoleLog(desc2);*/

    //return {percent: apy.toFormat(2) + '%', desc: desc2 };
  }

  calculateTime(time: string): number {
    const s = new Date(parseInt(time) * 1000);
    const diff = this.dayDiff(s, new Date());
    return diff;
  }

  dayDiff(d1: Date, d2: Date): number {
    const diff = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    return diffDays;
  }

  getSimbol(currency: string, flag: boolean) {
    if (currency == 'RUNE') {
      return 'ᚱ';
    } else if (currency == 'BUSD') {
      return '$';
    } else {
      return flag == true ? '$' : '';
    }
  }
}
