import BigNumber from 'bignumber.js';

export interface AssetTargetAmount {
    asset: string;
    target: string;
    assetAmount: BigNumber;
    targetAmount: BigNumber;
}
