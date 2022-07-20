export interface Volumes {
    volume?: Pool;
    depth?: Pool;
    swaps?: Pool;
    buyvolume?: Pool;
    sellvolume?: Pool;
    avgswapsize?: Pool;
    slipaverage?: Pool;
}

export interface History {
    total: number;
    tooltip: string;
}

export interface Pool {
    total: number;
    tooltip: string;
    table : Table[];
    chart: Chart;
}

export interface Table {
    rank: number
    asset: AssetName;
    value: number;
}
export interface Tables {
    volume: Table[];
    depth: Table[];
    swaps: Table[];
    buyvolume: Table[];
    sellvolume: Table[];
    avgswapsize: Table[];
    slipaverage: Table[];
}

export interface Chart {
    labels: string[];
    assetPoints: AssetPoints[];
}

export interface AssetPoints {
    asset: string;
    points: any[];
}

export interface VolumeTotal {
    value: string;
    tooltip: string;
}

export interface Totals {
    avgswapsize: number,
    buyvolume: number,
    depth: number,
    id: number,
    last_time: string,
    price: number,
    roi: number,
    sellvolume: number,
    slipaverage: number,
    staked: number,
    stakers: number,
    swaps: number,
    tooltip_avgswapsize: string,
    tooltip_buyvolume: string,
    tooltip_depth: string,
    tooltip_price: string,
    tooltip_roi: string,
    tooltip_sellvolume: string,
    tooltip_slipaverage: string,
    tooltip_staked: string,
    tooltip_stakers: string,
    tooltip_swaps: string,
    tooltip_volume: string,
    volume: number,
}

export interface VolumesTable {
    asset: AssetName,
    depth: number,
    volume: number,
    swaps: number,
    buyvolume: number,
    sellvolume: number,
    avgswapsize: number,
    slipaverage: number,
  }

export interface AssetName {
    chain: string,
    symbol: string,
    ticker: string,
    iconPath: string,
    fullname: string,
    nameChain: string
}

export interface VolumesData {

    asset: HistoryAsset,
    last_time: string,
    roi: number,
    stakers: number,
    staked: number,
    price: number,
    volume: number,
    depth: number,
    swaps: number,
    buyvolume: number,
    sellvolume: number,
    avgswapsize: number,
    slipaverage: number
}

export interface HistoryAsset {
    id: number;
    logo: string;
    name: string;
    status: string
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