import { Amount } from '../classes/amount';
export interface PoolDTO {
  asset: string;
  volume24h: string;
  assetDepth: string;
  assetPrice: string;
  assetPriceUSD: string;
  runeDepth: string;
  price: string;
  poolAPY: string;
  status: string;
  units: string;
  liquidityUnits: string;
  synthSupply: string;
  synthUnits: string;
}
