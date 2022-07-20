import BigNumber from 'bignumber.js';

export interface StakerOriginal {
    pool: string;
    totalAssetStake: BigNumber;
    totalTargetStake: BigNumber;
    totalAssetUnstake: BigNumber;
    totalTargetUnstake: BigNumber;
    totalWithdrawRatio: BigNumber;
    finalAsset: BigNumber;
    finalTarget: BigNumber;
}
