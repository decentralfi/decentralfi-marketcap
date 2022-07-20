import { Asset as AssetClass } from '@dexShared/classes/asset';
export interface PoolRates {
  staked?: Pool;
  stakers?: Pool;
  roi?: Pool;
  price?: Pool;
}

export interface Pool {
  total: number;
  tooltip: string;
  table: Table[];
  chart: Chart;
}

export interface Table {
  rank: number;
  asset?: AssetName;
  depth: string;
  value: number;
}

export interface Chart {
  labels?: string[];
  assetPoints: AssetPoints[];
  rawChart?: PoolHistory[];
}

export interface AssetPoints {
  asset?: string;
  points: any[];
}

export interface Total {
  value: string;
  tooltip: string;
}

export interface History {
  total: number;
  tooltip: string;
}

export interface EndpointAsset {
  pool: any;
  asset: Asset;
  value: number;
  time: string;
}

export interface Asset {
  name: string;
}

export interface PoolRatesTable {
  asset: AssetClass;
  price: number;
  depth: number;
  volume: number;
  swaps: number;
  roi: number;
  stakers: number;
  staked: number;
  slip: number;
  charts?: Chart[];
}

export interface PoolHistory {
  asset?: HistoryAsset;
  field: string;
  last_time: string;
  node_ip: string;
  response_sucess: boolean;
  time: string;
  value: number;
}

export interface HistoryAsset {
  id: number;
  logo: string;
  name: string;
  status: string;
}

export interface PoolRatesData {
  asset: HistoryAsset;
  last_time: string;
  roi: number;
  stakers: number;
  staked: number;
  price: number;
  volume: number;
  depth: number;
  swaps: number;
  buyvolume: number;
  sellvolume: number;
  avgswapsize: number;
  slipaverage: number;
}

export interface AssetName {
  chain: string;
  symbol: string;
  ticker: string;
  iconPath: string;
  fullname: string;
  nameChain: string;
}

export interface Totals {
  avgswapsize: number;
  buyvolume: number;
  depth: number;
  id: number;
  last_time: string;
  price: number;
  roi: number;
  sellvolume: number;
  slipaverage: number;
  staked: number;
  stakers: number;
  swaps: number;
  tooltip_avgswapsize: string;
  tooltip_buyvolume: string;
  tooltip_depth: string;
  tooltip_price: string;
  tooltip_roi: string;
  tooltip_sellvolume: string;
  tooltip_slipaverage: string;
  tooltip_staked: string;
  tooltip_stakers: string;
  tooltip_swaps: string;
  tooltip_volume: string;
  volume: number;
}
