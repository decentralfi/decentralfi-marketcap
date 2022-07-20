import BigNumber from 'bignumber.js';

export interface StakerTransaction {
    pool: string;
    asset: string;
    target: string;
    stakeUnit: BigNumber;
    assetAmount: BigNumber;
    targetAmount: BigNumber;
    type: string;
    memo: string;
    status: string;
    date: number;
}


export interface StakerTransactionList {
    pool: string;
    txs: StakerTransaction[];
}
