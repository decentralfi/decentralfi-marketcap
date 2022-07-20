export interface Network {
    totalcapital?: Pool;
    totalactivebond?: Pool;
    totalstandbybond?: Pool;
    totalreserve?: Pool;
    totalstaked?: Pool;
    totalactivenode?: Pool;
    totalstakers?: Pool;
    totalactiveusers?: Pool;
    totalblockreward?: Pool;
    totalblockheight?: Pool;
}

export interface Pool {
    total: number;
    tooltip: string;
    chart: Chart;
}

export interface PoolHistory {
    total: number;
    tooltip: string;
    chart: Chart;
    totalcapital?: Points[];
    totalactivebond?: Points[];
    totalstandbybond?: Points[];
    totalreserve?: Points[];
    totalstaked?: Points[];
    totalactivenode?: Points[];
    totalstakers?: Points[];
    totalactiveusers?: Points[];
    totalblockreward?: Points[];
    totalblockheight?: Points[];
}

export interface Points {
    value: number;
    time: string;
}

export interface Chart {
    assetPoints: any[];
}

export interface NetworkTotal {
    value: number;
    tooltip: string;
}

export interface History {
    total: number;
    tooltip: string;
}

export interface NetworkPendulum {
    totalActiveBond: number;
    totalStaked: number;
}