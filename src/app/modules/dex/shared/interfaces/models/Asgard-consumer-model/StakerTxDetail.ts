import {StakerTransaction} from './StakerTransaction';

export interface StakerTxState {
    count: number;
    pool: string;
    txDetail: StakerTxDetail[];
    // poolShare: StakerPoolShare;
}

export interface StakerTxDetail {
    poolHistory?: PoolBlock;
    price: Price;
    stakeTransaction: StakerTransaction;
    // poolShare: StakerPoolShare;
}

export interface StakerPoolShare {
    runeShare: number;
    assetShare: number;
    asset: string;
}

export interface StakeUnit {
    stakeUnits?: string;
}

export interface PoolBlock {
    balance_rune?: number;
    balance_asset?: number;
    asset?: string;
    pool_units?: number;
    status?: string;
    time?: string;
    height: number;
}

export interface Price {
    asset: string;
    assetPriceInRune: number;
    assetPriceInBUSD: number;
    runePriceInAsset: number;
    runePriceInBUSD: number;
    busdPriceInRune: number;
}

