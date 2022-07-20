import BigNumber from 'bignumber.js';
import { AssetAmount } from '@xchainjs/xchain-util';

export interface AssetBalance {
  asset: string;
  assetValue: AssetAmount;
  price: BigNumber;
}
