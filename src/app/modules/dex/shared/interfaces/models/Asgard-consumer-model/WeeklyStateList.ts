export interface WeeklyStateList {
    pool: string;
    data?: (WeeklyState)[] | null;
}
export interface WeeklyState {
    time: string;
    runedepth: number;
    assetdepth: number;
    poolunits: number;
    pricerune: string;
    stakeunit: string;
    day: string;
    busdpricerune: number;
}
