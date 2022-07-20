import BigNumber from 'bignumber.js';

export interface AssetSummary {
    asset: string;
    amount: BigNumber;
    percent: string;
}
