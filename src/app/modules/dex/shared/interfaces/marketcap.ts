import { Asset } from '../classes/asset';

export interface ServerError {
  status: number;
  details: string;
}

export interface MidgardPool {
  id: number;
  asset: FieldAsset;
  asset_depth: string;
  asset_price: string;
  asset_price_usd: string;
  pool_apy: string;
  rune_depth: string;
  units: string;
  volume24h: string;
}

export interface Pool {
  asset: string;
  assetDepth: string;
  assetPrice: string;
  assetPriceUSD: string;
  poolAPY: string;
  runeDepth: string;
  status: string;
  units: string;
  volume24h: string;
}

export interface MarketPool {
  rank: number;
  name: string;
  asset: AssetName;
  chain: string;
  price: number;
  depth: number;
  apy: number;
  volume: number;
  perc: number;
  weeklyChange: number;
  graph: any;
  status: string;
  isLoading: boolean;
}

export interface PoolDetail {
  rank: number;
  name: string;
  asset: AssetName;
  chain: string;
  price: number;
  depth: number;
  volume: number;
  perc: number;
  weeklyChange: number;
  swaps: number;
  buys: number;
  sells: number;
  swapFee: number;
  members: number;
  apy: number;
  swapSize: number;
  graph: any;
  status: string;
  isLoading: boolean;
}

export interface AssetName {
  fullname?: string;
  chain?: string;
  symbol?: string;
  ticker?: string;
  iconPath?: string;
}

export interface DepthPriceHistory {
  asset?: FieldAsset;
  last_time: string;
  intervals: Interval[];
}

export interface Interval {
  asset_depth: string;
  asset_price: string;
  asset_price_usd: string;
  end_time: string;
  liquidity_units: string;
  rune_depth: string;
  start_time: string;
}

export interface Meta {
  endTime: string;
  startTime: string;
}

export interface Ping {
  ping: string;
}

export interface Health {
  database: boolean;
  inSync: boolean;
  scannerHeight: string;
}

export interface InboundAddresses {
  chain: string;
  pub_key: string;
  address: string;
  halted: boolean;
  gas_rate: string;
}

export interface Queue {
  swap: number;
  outbound: number;
  internal: number;
}

export interface Stats {
  addLiquidityCount: string;
  addLiquidityVolume: string;
  dailyActiveUsers: string;
  impermanentLossProtectionPaid: string;
  monthlyActiveUsers: string;
  runeDepth: string;
  runePriceUSD: string;
  swapCount: string;
  swapCount24h: string;
  swapCount30d: string;
  swapVolume: string;
  switchedRune: string;
  toAssetCount: string;
  toRuneCount: string;
  uniqueSwapperCount: string;
  withdrawCount: string;
  withdrawVolume: string;
}

export interface Network {
  activeBonds: string[];
  activeNodeCount: string;
  blockRewards: BlockRewards;
  bondMetrics: BondMetrics;
  bondingAPY: string;
  liquidityAPY: string;
  nextChurnHeight: string;
  poolActivationCountdown: string;
  poolShareFactor: string;
  standbyBonds: string[];
  standbyNodeCount: string;
  totalPooledRune: string;
  totalReserve: string;
}

export interface BlockRewards {
  blockReward: string;
  bondReward: string;
  poolReward: string;
}

export interface BondMetrics {
  averageActiveBond: string;
  averageStandbyBond: string;
  maximumActiveBond: string;
  maximumStandbyBond: string;
  medianActiveBond: string;
  medianStandbyBond: string;
  minimumActiveBond: string;
  minimumStandbyBond: string;
  totalActiveBond: string;
  totalStandbyBond: string;
}

export interface PoolStats {
  addAssetLiquidityVolume: string;
  addLiquidityCount: string;
  addLiquidityVolume: string;
  addRuneLiquidityVolume: string;
  asset: string;
  assetDepth: string;
  assetPrice: string;
  assetPriceUSD: string;
  averageSlip: string;
  impermanentLossProtectionPaid: string;
  liquidityUnits: string;
  period?: string;
  poolAPY: string;
  runeDepth: string;
  status: string;
  swapCount: string;
  swapVolume: string;
  synthSupply: string;
  synthUnits: string;
  toAssetAverageSlip: string;
  toAssetCount: string;
  toAssetFees: string;
  toAssetVolume: string;
  toRuneAverageSlip: string;
  toRuneCount: string;
  toRuneFees: string;
  toRuneVolume: string;
  totalFees: string;
  uniqueMemberCount: string;
  uniqueSwapperCount: string;
  units: string;
  withdrawAssetVolume: string;
  withdrawCount: string;
  withdrawRuneVolume: string;
  withdrawVolume: string;
}

export interface DCFPoolStats {
  id: number;
  add_asset_liquidity_volume: number;
  add_liquidity_count: number;
  add_liquidity_volume: number;
  add_rune_liquidity_volume: number;
  asset_depth: number;
  asset_price: number;
  asset_price_usd: number;
  average_slip: number;
  impermanent_loss_protection_paid: number;
  liquidity_units: number;
  pool_apy: number;
  rune_depth: number;
  status: string;
  swap_count: number;
  swap_volume: number;
  synth_supply: number;
  synth_units: number;
  to_asset_average_slip: number;
  to_asset_count: number;
  to_asset_fees: number;
  to_asset_volume: number;
  to_rune_average_slip: number;
  to_rune_count: number;
  to_rune_fees: number;
  to_rune_volume: number;
  total_fees: number;
  unique_member_count: number;
  unique_swapper_count: number;
  units: number;
  withdraw_asset_volume: number;
  withdraw_count: number;
  withdraw_rune_volume: number;
  withdraw_volume: number;
  period: string;
  network: string;
  asset: number;
}

export interface HistoryField {
  asset: FieldAsset;
  field: string;
  last_time: string;
  time: string;
  value: number;
  response_success: boolean;
  node_ip: string;
}

export interface FieldPools {
  asset: FieldAsset;
  pool: FieldPool[];
  total_pool: number;
}
export interface FieldAsset {
  id: number;
  logo: any;
  name: string;
  network: string;
  status: string;
}
export interface FieldPool {
  node_ip: string;
  response_success: boolean;
  time: string;
  value: number;
}

export enum addressesTypes {
  thorchain = 'thorchain',
  binance = 'binance',
  bitcoin = 'bitcoin',
  bitcoincash = 'bitcoincash',
  ethereum = 'ethereum',
  litecoin = 'litecoin',
  dogecoin = 'dogecoin',
}

export interface WalletData {
  type: string;
  chain?: string;
  address?: string;
  mask?: string;
  logo?: string;
  totalBalance?: number;
  explorerURL?: string;
  balance?: WalletBalance[];
  remember?: boolean;
  chains?: addressesTypes[];
}

export interface WalletBalance {
  details?: string;
  asset: string;
  amount: number;
}

export interface WalletLiquidity {
  details?: string;
  pools: { [key: string]: LiquidityPoolValue };
  totals: LiquidityTotals;
}

export interface LiquidityPoolValue {
  pool_name?: Asset;
  current_liquidity: LiquidityValue;
  withdraw: LiquidityValue;
  gain_loss: LiquidityValue;
  gain_loss_percentage: LiquidityDisplay;
  hodl: LiquidityDisplay;
  liquidity_added: LiquidityValue;
  lp_days: number;
}

export interface LiquidityTotals {
  added_liquidity: LiquidityValue;
  apy: LiquidityValue;
  current_gain_loss: LiquidityValue;
  current_liquidity: LiquidityValue;
  dpy: LiquidityValue;
  gain_loss_percentage: LiquidityValue;
  wpy: LiquidityValue;
  withdraw: LiquidityValue;
}

export interface LiquidityValue {
  asset: number;
  rune: number;
  usd: number;
  total: {
    asset: number;
    rune: number;
    usd: number;
  };
}

export interface LiquidityPoolDisplay {
  pool_name?: AssetName;
  current_liquidity: LiquidityDisplay;
  withdraw: LiquidityDisplay;
  gain_loss: LiquidityDisplay;
  gain_loss_percentage: LiquidityDisplay;
  hodl: LiquidityDisplay;
  liquidity_added: LiquidityDisplay;
  lp_days: number;
}

export interface LiquidityDisplay {
  asset: number;
  rune: number;
  total: number;
}

export interface NONLPDetail {
  chain: string;
  asset: AssetName;
  value: number;
}

export interface LiquidityTrack {
  liquidity: Liquidity[];
}

export interface Liquidity {
  asset: FieldAsset;
  gain_loss_last_time: GainLossLastTime;
  history: LiquidityHistory[];
}

export interface GainLossLastTime {
  gain_loss_asset: number;
  gain_loss_rune: number;
  gain_loss_usd: number;
}

export interface LiquidityHistory {
  asset_share: number;
  id: number;
  liquidity: {
    asset: number;
    rune: number;
    usd: number;
  };
  rune_share: number;
  time: string;
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

export interface MemberDetail {
  pools: [
    {
      pool: string;
      runeAddress: string;
      assetAddress: string;
      liquidityUnits: string;
      runeAdded: string;
      assetAdded: string;
      runeWithdrawn: string;
      assetWithdrawn: string;
      dateFirstAdded: string;
      dateLastAdded: string;
    }
  ];
}

export interface spData {
  amount: number;
  input_asset: string;
  output_asset: string;
}

export interface spDataResponse {
  details?: string;
  applies?: boolean;
  asset?: boolean;
  message: string;
  division_transaction: number;
  amount_division: number;
  amount_transaction: number;
  amount_slip_fee_initial: number;
  amount_slip_transaction_total: number;
  amount_transaction_slip_usd: number;
  amount_transaction_usd: number;
  fee_transaction: number;
  fee_transaction_total_usd: number;
  savings_calculation: number;
  slip_amount_transaction: number;
  slip_amount_transaction_usd: number;
  slip_percentage_transaction: number;
  slip_transaction_total_usd: number;
  slip_percentage_global: number;
  slip_percentage_division: number;
  total_savings_calculation: number;
}

export enum Currency {
  Rune = 'rune',
  Asset = 'asset',
  Usd = 'usd',
}
