import BigNumber from 'bignumber.js';

export interface AssetShare {
    asset: string;
    ratio: number;
    amount: BigNumber;
    price: BigNumber;
}
