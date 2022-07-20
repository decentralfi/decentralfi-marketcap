import BigNumber from 'bignumber.js';

export interface Liquidity {}

export interface LPTotals {
  totalStaked: BigNumber;
  totalCurrent: BigNumber;
  totalWithdrawn: BigNumber;
  totalGainLoss: number;
  totalGainLossPerc: number;
  apy: number;
}

export interface Resume {
  totalWallet: BigNumber;
  totalLPPerc: BigNumber;
  apy: number;
  apw: number;
  apd: number;
  pie?: pieSerie[];
}

export interface pieSerie {
  value: number;
  name: string;
  itemStyle?: serieColor;
}

export interface serieColor {
  color?: string;
}

export interface liquidityAssetAmount {
  asset: string;
  amount: BigNumber;
}

export interface AssetName {
  chain?: string;
  symbol?: string;
  ticker?: string;
  iconPath?: string;
}
export interface HistoryChartData {
  status?: number;
  assetName?: AssetName;
  imp_loss?: any[];
  fee_accrual?: any[];
  total?: any[];
}

export interface TrackingStaked {
  status?: number;
  details?: string;
  staked?: History[];
}

export interface History {
  history: HistoryGraphics[];
  asset: Asset;
}

export interface HistoryGraphics {
  status?: number;
  graphics: HistoryData[];
  graph: number;
}

export interface HistoryData {
  time: string;
  asset_staked?: number;
  rune_staked?: number;
  asset_withdrawn?: string;
  rune_withdrawn?: string;
  asset_share?: number;
  rune_share?: number;
  lp?: number;
  hodl?: number;
  units?: number;
  imp_loss: number;
  fee_accrual: number;
  total: number;
  id: number;
}

export interface Asset {
  id: number;
  name: string;
  logo: string;
  status: string;
}

export interface AssetBUSDAmount {
  asset: string;
  amount: BigNumber;
}
