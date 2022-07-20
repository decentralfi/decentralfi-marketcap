import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Pool,
  MarketPool,
  DepthPriceHistory,
  Health,
  Queue,
  Stats,
  Network,
  PoolStats,
  PoolDetail,
  HistoryField,
  WalletData,
  WalletBalance,
} from '../interfaces/marketcap';
import { graphic } from 'echarts';
import { environment } from 'src/environments/environment';

import {
  CoinIconsFromTrustWallet,
  EthIconsFromTrustWallet,
} from '../constants/icon-list';

const dfc_api = environment.endpoint;
const dfc_network = environment.defaultThorVersion + '_' + environment.network;

@Injectable({
  providedIn: 'root',
})
export class MarketcapService {
  private currency = new BehaviorSubject<string>('USD');
  public currency$ = this.currency.asObservable();
  private originalPools = new BehaviorSubject<Pool[]>(null);
  public originalPools$ = this.originalPools.asObservable();
  private originalPriceChange = new BehaviorSubject(null);

  private originalStats24h = new BehaviorSubject<PoolStats[]>(null);
  private originalStats7d = new BehaviorSubject<PoolStats[]>(null);
  private originalStats30d = new BehaviorSubject<PoolStats[]>(null);
  private originalStats3m = new BehaviorSubject<PoolStats[]>(null);
  private originalStats1y = new BehaviorSubject<PoolStats[]>(null);

  private totalVolume24H = new BehaviorSubject<number>(null);
  private totalVolume1M = new BehaviorSubject<number>(null);
  public totalVolume24H$ = this.totalVolume24H.asObservable();
  public totalVolume1M$ = this.totalVolume1M.asObservable();

  private totalSwap24H = new BehaviorSubject<number>(null);
  private totalSwap1M = new BehaviorSubject<number>(null);
  public totalSwap24H$ = this.totalSwap24H.asObservable();
  public totalSwap1M$ = this.totalSwap1M.asObservable();

  private midgardStatus = new BehaviorSubject<boolean>(null);
  private thornodeStatus = new BehaviorSubject<boolean>(null);
  public midgardStatus$ = this.midgardStatus.asObservable();
  public thornodeStatus$ = this.thornodeStatus.asObservable();

  private walletData = new BehaviorSubject<WalletData[]>(null);
  public walletData$ = this.walletData.asObservable();
  private walletResume = new BehaviorSubject<number>(null);
  public walletResume$ = this.walletResume.asObservable();

  private endpointUrl: string = environment.midgard_endpoint;

  constructor(private http: HttpClient) {}

  public setWalletData(walletData: WalletData[]) {
    this.walletData.next(walletData);
  }

  public setTotalSwap24H(swap: number) {
    this.totalSwap24H.next(swap);
  }
  public setTotalSwap1M(swap: number) {
    this.totalSwap1M.next(swap);
  }

  public setTotalVolume24H(volume: number) {
    this.totalVolume24H.next(volume);
  }
  public setTotalVolume1M(volume: number) {
    this.totalVolume1M.next(volume);
  }

  public setMidgardStatus(status: boolean) {
    this.midgardStatus.next(status);
  }
  public setThornodeStatus(status: boolean) {
    this.thornodeStatus.next(status);
  }

  public setCurrency(currency: string) {
    this.currency.next(currency);
  }

  private setOriginalPools(pools: Pool[]) {
    this.originalPools.next(pools);
  }

  public getOriginalPools() {
    return this.originalPools.asObservable();
  }

  public setOriginalPriceChange(priceChange: DepthPriceHistory[]) {
    this.originalPriceChange.next(priceChange);
  }

  public getOriginalPriceChange() {
    return this.originalPriceChange.asObservable();
  }

  public setOriginalStats24h(stats: PoolStats[]) {
    this.originalStats24h.next(stats);
  }
  public setOriginalStats7d(stats: PoolStats[]) {
    this.originalStats7d.next(stats);
  }
  public setOriginalStats30d(stats: PoolStats[]) {
    this.originalStats30d.next(stats);
  }
  public setOriginalStats3m(stats: PoolStats[]) {
    this.originalStats3m.next(stats);
  }
  public setOriginalStats1y(stats: PoolStats[]) {
    this.originalStats1y.next(stats);
  }

  public getOriginalStats24h() {
    return this.originalStats24h.asObservable();
  }
  public getOriginalStats7d() {
    return this.originalStats7d.asObservable();
  }
  public getOriginalStats30d() {
    return this.originalStats30d.asObservable();
  }
  public getOriginalStats3m() {
    return this.originalStats3m.asObservable();
  }
  public getOriginalStats1y() {
    return this.originalStats1y.asObservable();
  }

  public getPools(asset: string): Observable<any> {
    return this.http
      .get<Pool[]>(this.endpointUrl + 'pools/')
      .pipe(map((pools: Pool[]) => this.createPoolList(pools, asset)));
  }

  public getDepthPriceHistory(
    asset: string,
    interval: string,
    from: string,
    to: string
  ): Observable<DepthPriceHistory> {
    const params = new HttpParams()
      .set('interval', interval)
      .set('from', from)
      .set('to', to);

    return this.http.get<DepthPriceHistory>(
      `${this.endpointUrl}history/depths/${asset}`,
      { params }
    );
  }

  public getAssetAPY(interval: string): Observable<HistoryField> {
    return this.http.get<HistoryField>(
      `${dfc_api}history/roi/asset/0/time/${interval}/network/${dfc_network}/`
    );
  }

  public getAssetMembers(interval: string): Observable<HistoryField> {
    return this.http.get<HistoryField>(
      `${dfc_api}history/stakers/asset/0/time/${interval}/network/${dfc_network}/`
    );
  }

  public getHeatlh(): Observable<Health> {
    return this.http.get<Health>(`${this.endpointUrl}health/`);
  }

  public getQueue(): Observable<Queue> {
    return this.http.get<Queue>(`${this.endpointUrl}thorchain/queue/`);
  }

  public getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.endpointUrl}stats/`);
  }

  public getNetwork(): Observable<Network> {
    return this.http.get<Network>(`${this.endpointUrl}network/`);
  }

  public findBalance(wallet: WalletData, currency: string): Observable<any> {
    let blockchainNetwork =
      environment.network == 'testnet' ? 'testnet' : 'mainnet';
    if (this.originalPools.value == null) {
      this.getPools('USD').subscribe();
    }
    return this.http
      .get<WalletBalance[]>(
        `${dfc_api}balance/address/${wallet.address}/${blockchainNetwork}/`
      )
      .pipe(
        map((balance: WalletBalance[]) =>
          this.createBalance(wallet, balance, currency)
        )
      );
  }

  createBalance(
    wallet: WalletData,
    balance: WalletBalance[],
    currency: string
  ) {
    let details = this.walletData.value;
    wallet.balance = balance;
    wallet.totalBalance = this.createResumeByWallet(wallet, currency);
    if (details == null) {
      this.walletData.next([wallet]);
    } else {
      details.push(wallet);
      this.walletData.next(details);
    }

    this.createResume(currency);
  }

  createResumeByWallet(wallet: WalletData, currency: string): number {
    let BTCpool = this.originalPools.value.filter(
      (pool) => pool.asset == 'BTC.BTC'
    );
    let runePriceUSD = +BTCpool[0].assetPriceUSD / +BTCpool[0].assetPrice;
    let resume = 0;

    if (wallet.chain == 'LTC') {
      let LTCpool = this.originalPools.value.filter(
        (pool) => pool.asset == 'LTC.LTC'
      );
      resume = resume + +LTCpool[0].assetPrice * wallet.balance[0].amount;
    } else if (wallet.chain == 'BTC') {
      resume = resume + +BTCpool[0].assetPrice * wallet.balance[0].amount;
    } else if (wallet.chain == 'BCH') {
      let BCHpool = this.originalPools.value.filter(
        (pool) => pool.asset == 'BCH.BCH'
      );
      resume =
        resume +
        +BCHpool[0].assetPrice * (wallet.balance[0].amount / 100000000);
    } else if (wallet.chain == 'THOR') {
      resume = resume + +wallet.balance[0].amount / 100000000;
    } else if (wallet.chain == 'ETH') {
      for (let x = 0; x < wallet.balance.length; x++) {
        if (wallet.balance[x].asset.includes('RUNE') == true) {
          resume = resume + +wallet.balance[x].amount / 1000000000000000000;
        } else {
          let ETHpool = this.originalPools.value.filter((pool) =>
            pool.asset.includes(wallet.balance[x].asset)
          );
          let exponent = 1000000000000000000;
          if (wallet.balance[x].asset == 'ETH.USDT') {
            exponent = 1000000;
          }
          if (ETHpool.length > 0) {
            resume =
              resume +
              +ETHpool[0].assetPrice * (+wallet.balance[x].amount / exponent);
          }
        }
      }
    } else if (wallet.chain == 'BNB') {
      for (let x = 0; x < wallet.balance.length; x++) {
        if (wallet.balance[x].asset.includes('RUNE') == true) {
          resume = resume + +wallet.balance[x].amount;
        } else {
          let BNBpool = this.originalPools.value.filter(
            (pool) => pool.asset == 'BNB.' + wallet.balance[x].asset
          );
          if (BNBpool.length > 0) {
            resume =
              resume + +BNBpool[0].assetPrice * +wallet.balance[x].amount;
          }
        }
      }
    }

    if (currency == 'USD') {
      resume = resume * runePriceUSD;
    }

    return resume;
  }

  createResume(currency: string) {
    let details = this.walletData.value;
    let BTCpool = this.originalPools.value.filter(
      (pool) => pool.asset == 'BTC.BTC'
    );
    let runePriceUSD = +BTCpool[0].assetPriceUSD / +BTCpool[0].assetPrice;
    let resume = 0;
    for (let i = 0; i < details.length; i++) {
      if (details[i].chain == 'LTC') {
        let LTCpool = this.originalPools.value.filter(
          (pool) => pool.asset == 'LTC.LTC'
        );
        resume = resume + +LTCpool[0].assetPrice * details[i].balance[0].amount;
        details[i].explorerURL =
          'https://blockchair.com/litecoin/address/' + details[i].address;
      } else if (details[i].chain == 'BTC') {
        resume = resume + +BTCpool[0].assetPrice * details[i].balance[0].amount;
        details[i].explorerURL =
          'https://blockchair.com/bitcoin/address/' + details[i].address;
      } else if (details[i].chain == 'BCH') {
        let BCHpool = this.originalPools.value.filter(
          (pool) => pool.asset == 'BCH.BCH'
        );
        resume =
          resume +
          +BCHpool[0].assetPrice * (details[i].balance[0].amount / 100000000);
        details[i].explorerURL =
          'https://www.blockchain.com/es/bch/address/' + details[i].address;
      } else if (details[i].chain == 'THOR') {
        resume = resume + +details[i].balance[0].amount / 100000000;
        details[i].explorerURL =
          'https://thorchain.net/#/address/' + details[i].address;
      } else if (details[i].chain == 'ETH') {
        for (let x = 0; x < details[i].balance.length; x++) {
          if (details[i].balance[x].asset.includes('RUNE') == true) {
            resume =
              resume + +details[i].balance[x].amount / 1000000000000000000;
          } else {
            let ETHpool = this.originalPools.value.filter((pool) =>
              pool.asset.includes(details[i].balance[x].asset)
            );
            let exponent = 1000000000000000000;
            if (details[i].balance[x].asset == 'ETH.USDT') {
              exponent = 1000000;
            }
            if (ETHpool.length > 0) {
              resume =
                resume +
                +ETHpool[0].assetPrice *
                  (+details[i].balance[x].amount / exponent);
            }
          }
        }
        details[i].explorerURL =
          'https://etherscan.io/address/' + details[i].address;
      } else if (details[i].chain == 'BNB') {
        for (let x = 0; x < details[i].balance.length; x++) {
          if (details[i].balance[x].asset.includes('RUNE') == true) {
            resume = resume + +details[i].balance[x].amount;
          } else {
            let BNBpool = this.originalPools.value.filter(
              (pool) => pool.asset == 'BNB.' + details[i].balance[x].asset
            );
            if (BNBpool.length > 0) {
              resume =
                resume + +BNBpool[0].assetPrice * +details[i].balance[x].amount;
            }
          }
        }

        details[i].explorerURL =
          'https://explorer.binance.org/address/' + details[i].address;
      }
    }

    if (currency == 'USD') {
      resume = resume * runePriceUSD;
    }

    this.walletResume.next(resume);
  }

  public getPoolStats(asset: string, period?: string): Observable<PoolStats> {
    const url = period
      ? `${this.endpointUrl}pool/${asset}/stats?period=${period}`
      : `${this.endpointUrl}pool/${asset}/stats`;

    return this.http.get<PoolStats>(url);
  }

  public getStatsDetail(
    asset: string,
    period: string,
    currency: string
  ): Observable<any> {
    return this.http
      .get<PoolStats>(`${this.endpointUrl}pool/${asset}/stats?period=${period}`)
      .pipe(map((pool: PoolStats) => this.createDetailList(pool, currency)));
  }

  createDetailList(pool: PoolStats, currency: string): PoolDetail[] {
    let rank = 0;
    let asset = this.getAssetName(pool.asset);
    let runePriceBUSD = +pool.assetPriceUSD / +pool.assetPrice;
    if (currency == 'RUNE') {
      runePriceBUSD = 1;
    }
    let name = asset.ticker;
    let chain = asset.chain;
    let depth = this.calculateDepth(
      +pool.runeDepth,
      +pool.assetDepth,
      +pool.assetPriceUSD,
      runePriceBUSD,
      currency
    );
    let price = this.calculatePrice(
      currency,
      +pool.assetPriceUSD,
      +pool.assetPrice
    );
    let volume = this.calculateVolume(
      currency,
      +pool.swapVolume,
      runePriceBUSD
    );
    let perc = 0;
    let swaps = +pool.swapCount;
    let buys = +pool.toAssetVolume * runePriceBUSD;
    let sells = +pool.toRuneVolume * runePriceBUSD;
    let swapFee = +pool.averageSlip;
    let members = +pool.uniqueMemberCount;
    let apy = +pool.poolAPY;
    let swapSize = (volume / swaps) * runePriceBUSD;
    let isLoading = true;
    let status = pool.status;

    let graph = {
      grid: {
        height: 70,
        left: '0%',
        right: '0%',
        top: '0%',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 135,
        show: false,
      },
      series: [
        {
          data: [150, 230, 224, 218, 135, 147, 260],
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            normal: {
              color: 'rgba(255, 149, 0, 1)',
            },
          },
          areaStyle: {
            normal: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 149, 0, 1)' },
                { offset: 0.7, color: 'rgba(255, 149, 0, 0.5)' },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
              ]),
            },
          },
        },
      ],
    };

    let poolDetail: PoolDetail[] = [
      {
        rank: rank,
        name: name,
        asset: asset,
        chain: chain,
        price: price,
        depth: depth,
        volume: volume,
        perc: perc,
        weeklyChange: perc,
        swaps: swaps,
        buys: buys,
        sells: sells,
        swapFee: swapFee,
        members: members,
        apy: apy,
        swapSize: swapSize,
        graph: graph,
        status: status,
        isLoading: isLoading,
      },
    ];

    return poolDetail;
  }

  createPoolList(pools: Pool[], currency: string): MarketPool[] {
    let orderedPools = this.orderTableByFieldDesc(pools, 'runeDepth', currency);

    if (this.originalPools.value == null) {
      this.setOriginalPools(pools);
    }

    let graph = {
      grid: {
        height: 70,
        left: '0%',
        right: '0%',
        top: '0%',
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: 135,
        show: false,
      },
      series: [
        {
          data: [150, 230, 224, 218, 135, 147, 260],
          type: 'line',
          smooth: true,
          symbol: 'none',
          lineStyle: {
            normal: {
              color: 'rgba(255, 149, 0, 1)',
            },
          },
          areaStyle: {
            normal: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 149, 0, 1)' },
                { offset: 0.7, color: 'rgba(255, 149, 0, 0.5)' },
                { offset: 1, color: 'rgba(255, 255, 255, 0)' },
              ]),
            },
          },
        },
      ],
    };

    let poolList: MarketPool[] = [];

    for (const index in orderedPools) {
      let runePriceBUSD =
        +orderedPools[index].assetPriceUSD / +orderedPools[index].assetPrice;
      let asset = this.getAssetName(orderedPools[index].asset);

      let apy = +orderedPools[index].pool_apy;
      let depth = this.calculateDepth(
        +orderedPools[index].runeDepth,
        +orderedPools[index].assetDepth,
        +orderedPools[index].assetPriceUSD,
        runePriceBUSD,
        currency
      );
      let price = this.calculatePrice(
        currency,
        +orderedPools[index].assetPriceUSD,
        +orderedPools[index].assetPrice
      );
      let volume = this.calculateVolume(
        currency,
        +orderedPools[index].volume24h,
        runePriceBUSD
      );
      let pool: MarketPool = {
        rank: +index + 1,
        name: asset.ticker,
        asset: asset,
        chain: asset.chain,
        price: price,
        depth: depth,
        apy: apy,
        volume: volume,
        perc: 0,
        weeklyChange: 0,
        graph: graph,
        status: orderedPools[index].status,
        isLoading: true,
      };

      poolList.push(pool);
    }

    return poolList;
  }

  calculatePrice(currency: string, assetPriceUSD: number, assetPrice: number) {
    let price = currency == 'USD' ? assetPriceUSD : assetPrice;
    return price;
  }

  calculateVolume(currency: string, volume24h: number, runePriceBUSD: number) {
    let volume = currency == 'USD' ? volume24h * runePriceBUSD : volume24h;
    volume = isNaN(volume) ? 0 : volume;
    return volume;
  }

  calculateDepth(
    runeDepth: number,
    assetDepth: number,
    assetPrice: number,
    runePriceBUSD: number,
    currency: string
  ): number {
    let depth = 0;
    if (currency == 'USD') {
      depth = runeDepth * runePriceBUSD + assetDepth * assetPrice;
    } else {
      depth = runeDepth * 2;
    }

    depth = isNaN(depth) ? 0 : depth;

    return depth;
  }

  getAssetName(asset: string) {
    let fullname: string;
    let chain: string;
    let symbol: string;
    let ticker: string;
    let iconPath: string;

    fullname = asset;

    const data = asset.split('.');

    if (asset.includes('.')) {
      chain = data[0];
      symbol = data[1];
    } else {
      symbol = data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }

    const trustWalletMatch = CoinIconsFromTrustWallet[ticker];

    if (chain == 'ETH' && ticker != 'ETH') {
      // Find token icons from ethereum network
      const ethMatch = EthIconsFromTrustWallet[ticker];

      if (asset == 'ETH.ALCX-0XDBDB4D16EDA451D0503B854CF79D55697F90C8DF') {
        iconPath = 'https://etherscan.io/token/images/Alchemix_32.png';
      } else {
        iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${ethMatch}/logo.png`;
      }
    } else {
      if (trustWalletMatch) {
        iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
      } else {
        // Override token icons when not found in trustwallet
        switch (asset) {
          case 'BNB.BNB':
            iconPath =
              'https://app.thorswap.finance/static/media/asset-bnb.30ddcde6.svg';
            break;
          case 'ETH.ETH':
            iconPath =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/ETH-1C9/logo.png';
            break;
          case 'BTC.BTC':
            iconPath =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
            break;
          default:
            console.warn(
              `Icon not available for poolName ${asset}. Add override in src\\app\\_classes\\asset.ts`
            );
            iconPath =
              'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png';
            break;
        }
      }
    }

    return { fullname, chain, symbol, ticker, iconPath };
  }

  orderTableByFieldDesc(table: any, field: string, currency: string): any[] {
    return Array.from(table).sort((a: any, b: any) => {
      let aRunePriceBUSD = +a.assetPriceUSD / +a.assetPrice;
      let bRunePriceBUSD = +b.assetPriceUSD / +b.assetPrice;
      let aDepth = this.calculateDepth(
        +a.runeDepth,
        +a.assetDepth,
        +a.assetPriceUSD,
        aRunePriceBUSD,
        currency
      );
      let bDepth = this.calculateDepth(
        +b.runeDepth,
        +b.assetDepth,
        +b.assetPriceUSD,
        bRunePriceBUSD,
        currency
      );

      //consoleLog(aDepth);
      //consoleLog(bDepth);

      if (aDepth > bDepth) {
        return -1;
      } else if (aDepth < bDepth) {
        return 1;
      } else {
        return 0;
      }
    });
  }
}
