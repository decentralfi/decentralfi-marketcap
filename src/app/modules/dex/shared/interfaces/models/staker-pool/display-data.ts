import BigNumber from 'bignumber.js';

export interface DisplayData {
    pool: string;
    asset: string;
    shareAsset: BigNumber;
    shareTarget: BigNumber;
    totalAsset: BigNumber;
    totalTarget: BigNumber;
    profitAsset: BigNumber;
    profitTarget: BigNumber;
    percent: string;
    totalPricePool: BigNumber;
    totalPriceStake: BigNumber;
    totalPriceProfit: BigNumber;
    baseTicket: string;
}
