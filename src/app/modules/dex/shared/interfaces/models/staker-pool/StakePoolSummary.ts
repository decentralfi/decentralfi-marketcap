import BigNumber from 'bignumber.js';
import {AssetSummary} from './assetSummary';

export interface StakePoolSummary {
    asset: string;
    stake: PoolStakeAmount;
    withdraw?: PoolStakeAmount;
    time?: string;
}

export interface PoolStakeAmount {
    asset: string;
    assetAmount: BigNumber;
    targetAmount: BigNumber;
    totalAssetAmount: BigNumber;
    totalTargetAmount: BigNumber;
    totalBUSDAmount: BigNumber;
    newtotalBUSDAmount?: number;
    unit?: BigNumber;
}

export interface DisplaySummary {
    pool: string;
    currentShare: StakePoolSummary;
    original: StakePoolSummary;
    current: Profit;
    profit: Profit;
}

export interface Profit {
    baseTicker: string;
    totalPool: BigNumber;
    newtotalPool?: Number;
    totalStake: BigNumber;
    newtotalStake?: number;
    totalWithdraw: BigNumber;
    newtotalWithdraw?: number;
    totalGainLoss: BigNumber;
    newtotalGainLoss?: number;
    percentageNumber: number;
    percentage: string;
}

export interface ProfitSummary {
    baseTicker: string;
    totalPool: AssetSummary[];
    totalStake: AssetSummary[];
    totalWithdraw: AssetSummary[];
    totalGainLoss: AssetSummary[];
    percentageNumber: BigNumber;
    percentage: string;
}

