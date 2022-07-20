import BigNumber from 'bignumber.js';


export interface StakerShareInfo {
    pool: string;
    assertPrice: string;
    asset: string;
    target: string;
    stakeUnit: BigNumber;
    assetShare: BigNumber;
    targetShare: BigNumber;
}
