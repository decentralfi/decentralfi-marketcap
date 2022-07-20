import { Injectable } from '@angular/core';
import BigNumber from 'bignumber.js';
import { StakersAssetData } from '../interfaces/models/stakersAssetData';
import { PoolDetail } from '../interfaces/models/poolDetail';
import { TxDetails } from '../interfaces/models/txDetails';
import { StakerShareInfo } from '../interfaces/models/staker-pool/staker-info';
import { StakerTransaction } from '../interfaces/models/staker-pool/staker-transaction';
import { StakerOriginal } from '../interfaces/models/staker-pool/staker-original';
import { StakerProfit } from '../interfaces/models/staker-pool/staker-profit';
import { DisplayData } from '../interfaces/models/staker-pool/display-data';
import {
  PoolStakeAmount,
  Profit,
  StakePoolSummary,
} from '../interfaces/models/staker-pool/StakePoolSummary';
import {
  Price,
  StakerTxDetail,
} from '../interfaces/models/Asgard-consumer-model/StakerTxDetail';
import { environment } from 'src/environments/environment';
import { UtilsService } from './utils.service';
@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  constructor(private utils: UtilsService) {}

  baseNumber = Math.pow(10, 8); // 1e8

  calculatePoolData(
    userPool: { Asset: StakersAssetData },
    poolsMap: { [key: string]: PoolDetail },
    userTransactionMap: { Asset: [TxDetails] },
    poolList: Array<string>
  ): StakerShareInfo[] {
    const stakeInfors: StakerShareInfo[] = [];
    for (const [key, val] of Object.entries(userPool)) {
      // this.calculationServiceLogData(key, val);
      const eachPool = poolsMap[key];
      //     conle.log('eachpool ' + eachPool);

      const poolAsset = eachPool.asset;

      const stakeUnitsBN = new BigNumber(val.units);
      const poolShares = this.calculateShare(stakeUnitsBN, eachPool);
      // const price = new BigNumber(poolAsset.price);
      const price = eachPool.price;
      //     conle.log(eachPool);
      //     conle.log('prince in pool ' + price);
      const object = {
        pool: key,
        assertPrice: price,
        asset: this.utils.getAssetName(poolAsset),
        target: 'RUNE',
        stakeUnit: stakeUnitsBN,
        assetShare: poolShares[1],
        targetShare: poolShares[0],
      };
      stakeInfors.push(object);
    }
    return stakeInfors;
  }

  calculationTransactionData(
    poolsMap: { Asset: PoolDetail },
    userTransactionMap: { Asset: [TxDetails] },
    poolList: Array<string>
  ): {} {
    //     conle.log('userTransactionMap ' + userTransactionMap);
    const transactions: StakerTransaction[] = [];

    //     conle.log('user poold list +' + poolList);
    for (const [key, val] of Object.entries(userTransactionMap)) {
      //     conle.log('user poold key +' + key);
      //     conle.log('index +' + poolList.indexOf(key));
      if (poolList.indexOf(key) >= 0) {
        // const eachPool = poolsMap[key];
        for (const txDetail of val) {
          //     this.calculationServiceLogData('each tx');
          //     this.calculationServiceLogData(txDetail);
          if (txDetail.type === TxDetails.TypeEnum.Stake) {
            transactions.push(this.getStakeTransaction(txDetail));
          } else if (txDetail.type === TxDetails.TypeEnum.Unstake) {
            transactions.push(this.getUnstakeTransaction(txDetail));
          } else {
            //     this.calculationServiceLogData('error getting tx type');
          }
        }
      } else {
        //     this.calculationServiceLogData('this pool not activate');
      }
    }

    const transactionsMap = transactions.reduce(
      (
        dict: {
          [key: string]: any;
        },
        el,
        index
      ) => ((dict[el.pool] || (dict[el.pool] = [])).push(el), dict),
      {}
    );
    //     conle.log('transaction Map');
    //     conle.log(transactionsMap);
    return this.getTotalTransaction(transactionsMap);
  }

  getTotalTransaction(transactionMap: {}): {} {
    const stakeOriginal: {
      [key: string]: any;
    } = {};

    for (const [key, val] of Object.entries(transactionMap)) {
      let totalAssetStake = new BigNumber(0);
      let totalTargetStake = new BigNumber(0);
      let totalAssetUnstake = new BigNumber(0);
      let totalTargetUnstake = new BigNumber(0);
      let combineUnstakeRatio = new BigNumber(0);
      // @ts-ignore
      const transactions: StakerTransaction[] = val;

      for (const transaction of transactions.reverse()) {
        if (transaction.status !== 'Pending') {
          //  this.calculationServiceLogData('prcess with sucess status');
          if (transaction.type === 'stake') {
            totalAssetStake = totalAssetStake.plus(transaction.assetAmount);
            totalTargetStake = totalTargetStake.plus(transaction.targetAmount);
          } else {
            totalAssetUnstake = totalAssetUnstake.plus(transaction.assetAmount);
            totalTargetUnstake = totalTargetUnstake.plus(
              transaction.targetAmount
            );
            const raito = this.extractMemo(transaction.memo);
            if (raito.isGreaterThan(0)) {
              totalAssetStake = totalAssetStake.minus(
                totalAssetStake.multipliedBy(raito.div(10000))
              );
              totalTargetStake = totalTargetStake.minus(
                totalTargetStake.multipliedBy(raito.div(10000))
              );
            }
            combineUnstakeRatio = combineUnstakeRatio.plus(raito);
          }
        }
      }

      const finnalAsset = totalAssetStake;
      const finalTarget = totalTargetStake;

      const original: StakerOriginal = {
        pool: key,
        totalAssetStake,
        totalTargetStake,
        totalAssetUnstake,
        totalTargetUnstake,
        totalWithdrawRatio: combineUnstakeRatio,
        finalAsset: finnalAsset,
        finalTarget,
      };

      stakeOriginal[key] = original;
    }
    return stakeOriginal;
  }

  getStakeTransaction(txDetail: TxDetails): StakerTransaction {
    const pool = txDetail.pool;
    const type = txDetail.type.toString();
    const stakeUnit = new BigNumber(txDetail.events.stakeUnits);
    const memo = txDetail.in.memo;
    const status = txDetail.status.toString();
    const date = txDetail.date;
    let asset: string;
    let target: string;
    let assetAmount = new BigNumber(0);
    let targetAmount = new BigNumber(0);
    for (const coin of txDetail.in.coins) {
      if (coin.asset !== 'BNB.RUNE-B1A') {
        asset = coin.asset;
        assetAmount = new BigNumber(coin.amount);
      } else {
        target = coin.asset;
        targetAmount = new BigNumber(coin.amount);
      }
    }
    return {
      pool,
      asset,
      target,
      stakeUnit,
      assetAmount,
      targetAmount,
      type,
      memo,
      status,
      date,
    };
  }

  getUnstakeTransaction(txDetail: TxDetails): StakerTransaction {
    //     conle.log(txDetail);
    const pool = txDetail.pool;
    const type = txDetail.type.toString();
    const stakeUnit = new BigNumber(txDetail.events.stakeUnits);
    const memo = txDetail.in.memo;
    const status = txDetail.status.toString();
    const date = txDetail.date;
    let asset: string;
    let target: string;
    let assetAmount = new BigNumber(0);
    let targetAmount = new BigNumber(0);

    for (const out of txDetail.out) {
      const coin = out.coins[0];
      if (coin !== undefined) {
        if (coin.asset !== 'BNB.RUNE-B1A') {
          asset = coin.asset;
          assetAmount = new BigNumber(coin.amount);
        } else {
          target = coin.asset;
          targetAmount = new BigNumber(coin.amount);
        }
      }
    }

    return {
      pool,
      asset,
      target,
      stakeUnit,
      assetAmount,
      targetAmount,
      type,
      memo,
      status,
      date,
    };
  }

  extractMemo(memo: string): BigNumber {
    const data = memo.split(':');
    const withdraw = data[2];
    return withdraw === undefined ? new BigNumber(0) : new BigNumber(withdraw);
  }

  /*calculateDisplayData(stakeProfits: StakerProfit[], bUSDPrice: BigNumber, baseTicket: string): DisplayData[]{
        // const baseTicket = 'ASSET'; // BUSD, RUNE, ASSET
        const displayArray: DisplayData[] = [];

        for (const stakerProfit of stakeProfits ){
          const profitDetail: StakerProfit = stakerProfit;
          let price: [pricePool: BigNumber, priceStake: BigNumber, priceProfit: BigNumber];
          if (baseTicket === 'BUSD'){
            price = this.calculateUSDValue(stakerProfit, bUSDPrice);
          }else if (baseTicket === 'RUNE'){
            price = this.calculateRuneValue(stakerProfit, bUSDPrice);
          }else if (baseTicket === 'ASSET'){
            price = this.calculateAssetValue(stakerProfit, bUSDPrice);
          }
          const display: DisplayData = {
            pool: stakerProfit.pool,
            asset: stakerProfit.asset,
            shareAsset: stakerProfit.shareAsset,
            shareTarget: stakerProfit.shareTarget,
            totalAsset: stakerProfit.totalAsset,
            totalTarget: stakerProfit.totalTarget,
            profitAsset: stakerProfit.profitAsset,
            profitTarget: stakerProfit.profitTarget,
            percent: stakerProfit.percent,
            totalPricePool: price[0],
            totalPriceStake: price[1],
            totalPriceProfit: price[2],
            baseTicket: (baseTicket === 'ASSET') ? this.trimTicker(stakerProfit.asset) : baseTicket
          };
          displayArray.push(display);
        }
        return displayArray;
  }*/

  //calculateUSDValue(stakeProfit: StakerProfit, bUSDPrice: BigNumber): [pricePool: BigNumber, priceStake: BigNumber, priceProfit: BigNumber]{
  calculateUSDValue(stakeProfit: StakerProfit, bUSDPrice: BigNumber) {
    const priceINBUSD = bUSDPrice;
    const priceInRUNE = new BigNumber(1).div(priceINBUSD);
    const priceInASSET = stakeProfit.priceInRune.multipliedBy(priceInRUNE);

    const shareTargetPrice = stakeProfit.shareTarget.multipliedBy(priceInRUNE);
    const shareAssetPrice = stakeProfit.shareAsset.multipliedBy(priceInASSET);
    const totalSharePrice = shareTargetPrice.plus(shareAssetPrice);

    const stakeTargetPrice = stakeProfit.totalTarget.multipliedBy(priceInRUNE);
    const stakeAssetPrice = stakeProfit.totalAsset.multipliedBy(priceInASSET);
    const totalStakePrice = stakeTargetPrice.plus(stakeAssetPrice);

    const profitTargetPrice =
      stakeProfit.profitTarget.multipliedBy(priceInRUNE);
    const profitAssetPrice = stakeProfit.profitAsset.multipliedBy(priceInASSET);
    const totalProfitPrice = profitTargetPrice.plus(profitAssetPrice);

    return [totalSharePrice, totalStakePrice, totalProfitPrice];
  }

  //calculateRuneValue(stakeProfit: StakerProfit, bUSDPrice: BigNumber): [pricePool: BigNumber, priceStake: BigNumber, priceProfit: BigNumber]{
  calculateRuneValue(stakeProfit: StakerProfit, bUSDPrice: BigNumber) {
    const assetPriceInRune = stakeProfit.priceInRune;

    const totalStakePrice = stakeProfit.totalAsset
      .multipliedBy(assetPriceInRune)
      .plus(stakeProfit.totalTarget);

    const totalSharePrice = stakeProfit.shareAsset
      .multipliedBy(assetPriceInRune)
      .plus(stakeProfit.shareTarget);

    const totalProfitPrice = stakeProfit.profitAsset
      .multipliedBy(assetPriceInRune)
      .plus(stakeProfit.profitTarget);

    return [totalSharePrice, totalStakePrice, totalProfitPrice];
  }

  //calculateAssetValue(stakeProfit: StakerProfit, bUSDPrice: BigNumber): [pricePool: BigNumber, priceStake: BigNumber, priceProfit: BigNumber]{
  calculateAssetValue(stakeProfit: StakerProfit, bUSDPrice: BigNumber) {
    const assetPriceInRune = stakeProfit.priceInRune;
    const totalStakePrice = stakeProfit.totalTarget
      .div(assetPriceInRune)
      .plus(stakeProfit.totalAsset);
    const totalSharePrice = stakeProfit.shareTarget
      .div(assetPriceInRune)
      .plus(stakeProfit.shareAsset);
    const totalProfitPrice = stakeProfit.profitTarget
      .div(assetPriceInRune)
      .plus(stakeProfit.profitAsset);
    return [totalSharePrice, totalStakePrice, totalProfitPrice];
  }

  trimTicker(ticker: string): string {
    if (ticker.length > 6) {
      return ticker.substr(0, 5) + '.';
    } else {
      return ticker;
    }
  }

  calculateHistoricalSummary(
    stakerTxDetail: StakerTxDetail[],
    price: BigNumber
  ): StakePoolSummary {
    let totalAssetStake = new BigNumber(0);
    let totalTargetStake = new BigNumber(0);
    let totalConvertedTarget = new BigNumber(0);
    let totalConvertedAsset = new BigNumber(0);
    let totalConvertedUSD = new BigNumber(0);

    let totalAssetUnstake = new BigNumber(0);
    let totalTargetUnstake = new BigNumber(0);
    let totalConvertedTargetUnstake = new BigNumber(0);
    let totalConvertedAssetUnstake = new BigNumber(0);
    let totalConvertedUSDUnstake = new BigNumber(0);

    let asset = '';
    let time: string;

    for (const txDetail of stakerTxDetail) {
      const transaction = txDetail.stakeTransaction;
      if (time === undefined) {
        time = transaction.time;
      }
      asset = transaction.asset;
      // tslint:disable-next-line:radix max-line-length

      if (transaction.status !== 'Pending') {
        const assetAmountBN = new BigNumber(transaction.assetamount);
        const targetAmountBN = new BigNumber(transaction.targetamount);
        const poolPrice = txDetail.price;
        const priceInRune = new BigNumber(poolPrice.busdPriceInRune);
        const assetPriceInRune = new BigNumber(poolPrice.assetPriceInRune);
        const runePrinceINUSD = new BigNumber(poolPrice.runePriceInBUSD);
        const assetPriceInUSD = new BigNumber(poolPrice.assetPriceInBUSD);
        //    consoleLog(poolPrice);

        if (transaction.type === 'stake') {
          const totalAsset = this.calculateAssetTotal(
            assetAmountBN,
            targetAmountBN,
            priceInRune,
            assetPriceInRune
          );
          const totalTarget = this.calculateTargetTotal(
            assetAmountBN,
            targetAmountBN,
            priceInRune,
            assetPriceInRune
          );
          const totalUSD = this.calculateUSDTotal(
            assetAmountBN,
            targetAmountBN,
            priceInRune,
            assetPriceInRune
          );

          totalAssetStake = totalAssetStake.plus(assetAmountBN);
          totalTargetStake = totalTargetStake.plus(targetAmountBN);
          totalConvertedAsset = totalConvertedAsset.plus(totalAsset);
          totalConvertedTarget = totalConvertedTarget.plus(totalTarget);
          totalConvertedUSD = totalConvertedUSD.plus(totalUSD);
        } else {
          const assetUnstake = this.calculateAssetTotal(
            assetAmountBN,
            targetAmountBN,
            priceInRune,
            assetPriceInRune
          );
          const targetUnstake = this.calculateTargetTotal(
            assetAmountBN,
            targetAmountBN,
            priceInRune,
            assetPriceInRune
          );
          const totalUSDUnstake = this.calculateUSDTotal(
            assetAmountBN,
            targetAmountBN,
            priceInRune,
            assetPriceInRune
          );

          totalAssetUnstake = totalAssetUnstake.plus(assetAmountBN);
          totalTargetUnstake = totalTargetUnstake.plus(targetAmountBN);
          totalConvertedAssetUnstake =
            totalConvertedAssetUnstake.plus(assetUnstake);
          totalConvertedTargetUnstake =
            totalConvertedTargetUnstake.plus(targetUnstake);
          totalConvertedUSDUnstake =
            totalConvertedUSDUnstake.plus(totalUSDUnstake);
        }
      } else {
      }
    }
    const stakeState: PoolStakeAmount = {
      asset,
      assetAmount: totalAssetStake,
      targetAmount: totalTargetStake,
      totalAssetAmount: totalConvertedAsset,
      totalTargetAmount: totalConvertedTarget,
      totalBUSDAmount: totalConvertedUSD,
    };

    const withdrawState: PoolStakeAmount = {
      asset,
      assetAmount: totalAssetUnstake,
      targetAmount: totalTargetUnstake,
      totalAssetAmount: totalConvertedAssetUnstake,
      totalTargetAmount: totalConvertedTargetUnstake,
      totalBUSDAmount: totalConvertedUSDUnstake,
    };

    const summary: StakePoolSummary = {
      asset,
      stake: stakeState,
      withdraw: withdrawState,
      time,
    };
    return summary;
  }

  calculateCurrentOriginalSummary(
    poolDetail: PoolDetail,
    originalPoolSummary: StakePoolSummary,
    price: BigNumber
  ): StakePoolSummary {
    const priceInRuneBN = new BigNumber(poolDetail.price);
    // tslint:disable-next-line:max-line-length
    const totalUSD = this.calculateUSDTotal(
      originalPoolSummary.stake.assetAmount,
      originalPoolSummary.stake.targetAmount,
      price,
      priceInRuneBN
    );
    // tslint:disable-next-line:max-line-length
    /*consoleLog('originalPoolSummary');
    consoleLog(originalPoolSummary);*/
    const totalUSDWithraw = this.calculateUSDTotal(
      originalPoolSummary.withdraw.assetAmount,
      originalPoolSummary.withdraw.targetAmount,
      price,
      priceInRuneBN
    );

    const stake = originalPoolSummary.stake;
    stake.totalBUSDAmount = totalUSD;

    const withdraw = originalPoolSummary.withdraw;
    withdraw.totalBUSDAmount = totalUSDWithraw;

    const summary: StakePoolSummary = {
      asset: originalPoolSummary.asset,
      stake,
      withdraw,
      time: originalPoolSummary.time,
    };
    return summary;
  }

  calculatePoolShareSummary(
    poolDetail: PoolDetail,
    stakersAssetData: StakersAssetData,
    price: BigNumber
  ): StakePoolSummary {
    const stakeUnitsBN = new BigNumber(stakersAssetData.units);
    const priceInRuneBN = new BigNumber(poolDetail.price);
    const poolShare = this.calculateShare(stakeUnitsBN, poolDetail);
    const totalUSD = this.calculateUSDTotal(
      poolShare[1],
      poolShare[0],
      price,
      priceInRuneBN
    );
    const totalTarget = this.calculateTargetTotal(
      poolShare[1],
      poolShare[0],
      price,
      priceInRuneBN
    );
    const totalAsset = this.calculateAssetTotal(
      poolShare[1],
      poolShare[0],
      price,
      priceInRuneBN
    );

    const currentStake: PoolStakeAmount = {
      asset: stakersAssetData.asset,
      assetAmount: poolShare[1],
      targetAmount: poolShare[0],
      totalAssetAmount: totalAsset,
      totalTargetAmount: totalTarget,
      totalBUSDAmount: totalUSD,
      unit: stakeUnitsBN,
    };

    const summary: StakePoolSummary = {
      asset: stakersAssetData.asset,
      stake: currentStake,
    };
    return summary;
  }

  calculateUSDTotal(
    amount: BigNumber,
    targetAmount: BigNumber,
    runeInBUSDPrice: BigNumber,
    priceInRune: BigNumber
  ): BigNumber {
    const runePriceINBUSD = runeInBUSDPrice;
    const busdPriceInRUNE = new BigNumber(1).div(runePriceINBUSD);
    const priceInASSET = priceInRune.multipliedBy(busdPriceInRUNE);

    const totalTarget = this.calculateTargetTotal(
      amount,
      targetAmount,
      runeInBUSDPrice,
      priceInRune
    );

    const targetPrice = totalTarget.multipliedBy(busdPriceInRUNE);
    // const assetPrice = amount.multipliedBy(priceInASSET);
    // const totalPrice = targetPrice.plus(assetPrice);
    // chage
    return targetPrice;
  }

  calculateTargetTotal(
    amount: BigNumber,
    targetAmount: BigNumber,
    runeInBUSDPrice: BigNumber,
    priceInRune: BigNumber
  ): BigNumber {
    const assetPriceInRune = priceInRune;
    const totalStakePrice = amount
      .multipliedBy(assetPriceInRune)
      .plus(targetAmount);
    return new BigNumber(totalStakePrice);
  }

  calculateAssetTotal(
    amount: BigNumber,
    targetAmount: BigNumber,
    runeInBUSDPrice: BigNumber,
    priceInRune: BigNumber
  ): BigNumber {
    const assetPriceInRune = priceInRune;
    const totalStakePrice = targetAmount.div(assetPriceInRune).plus(amount);
    return totalStakePrice;
  }

  //calculateShare(stakeUnitsBN: BigNumber, eachPool: PoolDetail ): [runeShare: BigNumber, assetShare: BigNumber]{
  calculateShare(stakeUnitsBN: BigNumber, eachPool: PoolDetail) {
    const runeDepthBN = new BigNumber(eachPool.runeDepth);
    const assetDepthBN = new BigNumber(eachPool.assetDepth);
    const poolUnitsBN = new BigNumber(eachPool.poolUnits);

    const runeShare = poolUnitsBN
      ? runeDepthBN.multipliedBy(stakeUnitsBN).div(poolUnitsBN)
      : new BigNumber(0);
    const assetShare = poolUnitsBN
      ? assetDepthBN.multipliedBy(stakeUnitsBN).div(poolUnitsBN)
      : new BigNumber(0);

    return [runeShare, assetShare];
  }

  computeCurrentPercentage(
    now: StakePoolSummary,
    current: StakePoolSummary
  ): Profit {
    const currentOriginal = current.stake.totalBUSDAmount;
    const nowUSD = now.stake.totalBUSDAmount.plus(
      current.withdraw.totalBUSDAmount
    );
    // const profitAmount = now.stake.totalBUSDAmount.minus(currentOriginal);
    const profitAmount = nowUSD.minus(currentOriginal);
    const percent = profitAmount.div(currentOriginal).multipliedBy(100);

    let prefix = '+';
    if (percent.isLessThan(0)) {
      prefix = '';
    }
    const profit: Profit = {
      baseTicker: 'BUSD',
      totalPool: new BigNumber(0),
      newtotalPool: 0,
      totalStake: new BigNumber(0),
      totalWithdraw: new BigNumber(0),
      totalGainLoss: profitAmount,
      percentageNumber: percent.toNumber(),
      percentage: prefix + percent.toFixed(2) + '%',
    };
    return profit;
  }

  calculateProfilt(
    original: StakePoolSummary,
    current: StakePoolSummary,
    base: string,
    baseTicker: string
  ): Profit {
    //consoleLog(original.stake.newtotalBUSDAmount);
    const baseTickerPool = baseTicker === 'ASSET' ? base : baseTicker;
    let gainLoss: number = 0;
    switch (baseTicker) {
      case 'BUSD':
        const profit = this.calculatePercent(
          original.stake.totalBUSDAmount,
          current.stake.totalBUSDAmount.plus(original.withdraw.totalBUSDAmount)
        );
        gainLoss = current.stake.totalBUSDAmount
          .plus(original.withdraw.newtotalBUSDAmount)
          .minus(original.stake.newtotalBUSDAmount)
          .toNumber();

        const profitPercentage = this.getProfitPercentage(
          gainLoss,
          original.stake.newtotalBUSDAmount
        );
        const price: Profit = {
          baseTicker: baseTickerPool,
          totalPool: current.stake.totalBUSDAmount,
          totalStake: original.stake.totalBUSDAmount,
          newtotalStake: original.stake.newtotalBUSDAmount,
          totalWithdraw: original.withdraw.totalBUSDAmount,
          newtotalWithdraw: original.withdraw.newtotalBUSDAmount,
          totalGainLoss: profit[0],
          newtotalGainLoss: gainLoss,
          percentageNumber: profitPercentage[0],
          percentage: profitPercentage[1],
        };
        return price;
      case 'RUNE':
        // tslint:disable-next-line:max-line-length
        const profit1 = this.calculatePercent(
          original.stake.totalTargetAmount,
          current.stake.totalTargetAmount.plus(
            original.withdraw.totalTargetAmount
          )
        );
        const profitPercentage1 = this.getProfitPercentage(
          profit1[0].toNumber(),
          original.stake.totalTargetAmount.toNumber()
        );
        const price1: Profit = {
          baseTicker: baseTickerPool,
          totalPool: current.stake.totalTargetAmount,
          totalStake: original.stake.totalTargetAmount,
          totalWithdraw: original.withdraw.totalTargetAmount,
          totalGainLoss: profit1[0],
          percentageNumber: profitPercentage1[0],
          percentage: profitPercentage1[1],
        };
        return price1;
      case 'ASSET':
        // tslint:disable-next-line:max-line-length
        const profit2 = this.calculatePercent(
          original.stake.totalAssetAmount,
          current.stake.totalAssetAmount.plus(
            original.withdraw.totalAssetAmount
          )
        );
        gainLoss =
          current.stake.totalBUSDAmount.toNumber() +
          original.withdraw.newtotalBUSDAmount -
          original.stake.newtotalBUSDAmount;
        const profitPercentage2 = this.getProfitPercentage(
          profit2[0].toNumber(),
          original.stake.totalAssetAmount.toNumber()
        );
        const price2: Profit = {
          baseTicker: baseTickerPool,
          totalPool: current.stake.totalAssetAmount,
          newtotalPool: current.stake.newtotalBUSDAmount,
          totalStake: original.stake.totalAssetAmount,
          newtotalStake: original.stake.newtotalBUSDAmount,
          totalWithdraw: original.withdraw.totalAssetAmount,
          newtotalWithdraw: original.withdraw.newtotalBUSDAmount,
          totalGainLoss: profit2[0],
          newtotalGainLoss: gainLoss,
          percentageNumber: profitPercentage2[0],
          percentage: profitPercentage2[1],
        };
        return price2;
    }
  }

  calculatePercent(
    original: BigNumber,
    current: BigNumber
  ): [BigNumber, BigNumber, string] {
    const percent = current.minus(original).div(original);
    let prefix = '';
    if (percent.isGreaterThan(0)) {
      prefix = '+';
    }
    return [
      current.minus(original),
      percent,
      prefix + percent.multipliedBy(100).toFixed(2) + '%',
    ];
  }

  getProfitPercentage(profit: number, stake: number): [number, string] {
    //simple rule of 3
    //let percent = (profit * 100) / stake;

    let percent = (profit / stake) * 100;
    let prefix = '';
    if (percent > 0) {
      prefix = '+';
    }

    return [percent, prefix + percent.toFixed(2) + '%'];
  }
}
