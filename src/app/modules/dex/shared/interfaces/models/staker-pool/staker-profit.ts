import BigNumber from 'bignumber.js';

export interface StakerProfit {
    pool: string;
    asset: string;
    shareAsset: BigNumber;
    shareTarget: BigNumber;
    totalAsset: BigNumber;
    totalTarget: BigNumber;
    withdrawRatio: string;
    profitAsset: BigNumber;
    profitTarget: BigNumber;
    percent: string;
    pricePoolShareNum: BigNumber;
    pricePoolShare: string;
    priceOriginalStake: string;
    priceInProfit: string;
    priceInRune: BigNumber;
}
