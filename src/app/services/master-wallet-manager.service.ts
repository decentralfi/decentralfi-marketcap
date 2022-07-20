import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import {
  MidgardPool,
  MarketPool,
  DepthPriceHistory,
  Health,
  InboundAddresses,
  Ping,
  Queue,
  Stats,
  Network,
  PoolStats,
  DCFPoolStats,
  PoolDetail,
  HistoryField,
  WalletData,
  WalletBalance,
  WalletLiquidity,
  NONLPDetail,
  AssetName,
  LiquidityTrack,
  Totals,
  spData,
  spDataResponse,
  Currency,
} from '../modules/dex/shared/interfaces/marketcap';
import { graphic } from 'echarts';
import { environment } from 'src/environments/environment';
import { RoundedValuePipe } from '../modules/dex/shared/pipes/rounded-value.pipe';
import { Resume, pieSerie } from '../modules/dex/shared/interfaces/liquidity';

import { Asset } from '@app/modules/dex/shared/classes/asset';
import { bn } from '@xchainjs/xchain-util';
import {
  CoinIconsFromTrustWallet,
  EthIconsFromTrustWallet,
} from '@app/modules/dex/shared/constants/icon-list';

import { MockClientService } from 'src/app/services/mock-client.service';

//import { UserService } from '@dexShared/services/user.service';
import * as bchRegex from 'bitcoincash-regex';
import { consoleLog } from '@app/utils/consoles';
import { getDecimal, ETH_DECIMAL } from '@xchainjs/xchain-ethereum';

export interface LTCBalance {
  address: string;
  balance: number;
  final_balance: number;
  final_n_tx: number;
  n_tx: number;
  total_received: number;
  total_sent: number;
  unconfirmed_balance: number;
  unconfirmed_n_tx: number;
}

const dfc_api = environment.endpoint;
const network = environment.network;
const defaultThorVersion = environment.defaultThorVersion;

// this declare var to use plausible custom events
declare var plausible: any;

@Injectable({
  providedIn: 'root',
})
export class MasterWalletManagerService {
  public dcf_networkPath = defaultThorVersion + '_' + network;
  private globalNetwork = new BehaviorSubject<string>('MCCN');
  public globalNetwork$ = this.globalNetwork.asObservable();

  private globalShowHide = new BehaviorSubject<boolean>(null);
  public globalShowHide$ = this.globalShowHide.asObservable();

  public bitcoinRegex =
    /^(?:[13]{1}[a-km-zA-HJ-NP-Z1-9]{26,33}|bc1[a-z0-9]{39,59}|tb1[a-z0-9]{39,59})$/;
  public litecoinRegex =
    /(?:^[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}|tltc[a-z0-9]{39,59}|ltc[a-z0-9]{39,59}$)/;
  public ethereumRegex = /^0x[a-fA-F0-9]{40}$/;
  public binanceRegex = /^(?:tbnb[a-z0-9]{39,59}|bnb[a-z0-9]{39,59})$/;
  public thorchainRegex = /^(?:thor[a-z0-9]{39,59}|tthor[a-z0-9]{39,59})$/;
  public dogeRegex =
    /^(?:D{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32}|n{1}[5-9A-HJ-NP-U]{1}[1-9A-HJ-NP-Za-km-z]{32})$/;

  constructor(
    private http: HttpClient,
    private roundedPipe: RoundedValuePipe,
    private mockClientService: MockClientService
  ) {
    /*let networkPath = localStorage.getItem('dcf-network');
    if (networkPath == null) {
      localStorage.setItem('dcf-network', this.dcf_networkPath);
    } else {
      this.dcf_networkPath = networkPath;
    }*/

    if (this.dcf_networkPath === 'multichain_testnet') {
      this.endpointUrl = 'https://testnet.midgard.thorchain.info/v2/';
    } else {
      this.endpointUrl = 'https://midgard.thorchain.info/v2/';
    }

    this.updateWalletDataBalances();

    const language = localStorage.getItem('dcf_lang');
    if (!language) {
      localStorage.setItem('dcf_lang', this.language.value);
    } else {
      this.setLanguage(language);
    }
  }

  private currency = new BehaviorSubject<string>('USD');
  public currency$ = this.currency.asObservable();
  private LPwallet = new BehaviorSubject<string>(null);
  public LPwallet$ = this.LPwallet.asObservable();
  private originalPools = new BehaviorSubject<MidgardPool[]>(null);
  public originalPools$ = this.originalPools.asObservable();
  private originalPriceChange = new BehaviorSubject<DepthPriceHistory[]>(null);
  public originalPriceChange$ = this.originalPriceChange.asObservable();

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

  private walletData = new BehaviorSubject<WalletData[]>(
    JSON.parse(localStorage.getItem('dcf-wallet-data'))
  );
  public walletData$ = this.walletData.asObservable();

  private walletResume = new BehaviorSubject<number>(null);
  public walletResume$ = this.walletResume.asObservable();

  private walletLiquidity = new BehaviorSubject<WalletLiquidity>(null);
  public walletLiquidity$ = this.walletLiquidity.asObservable();

  private LPResume = new BehaviorSubject<Resume>(null);
  public LPResume$ = this.LPResume.asObservable();

  private NONLPResume = new BehaviorSubject<Resume>(null);
  public NONLPResume$ = this.NONLPResume.asObservable();

  private MCCNTrackingLiquidity = new BehaviorSubject<LiquidityTrack>(null);
  public MCCNTrackingLiquidity$ = this.MCCNTrackingLiquidity.asObservable();

  private originalDCFTotals = new BehaviorSubject<Totals[]>(null);
  public originalDCFTotals$ = this.originalDCFTotals.asObservable();

  private originalStats = new BehaviorSubject<Stats>(null);
  public originalStats$ = this.originalStats.asObservable();

  private language = new BehaviorSubject<string>(environment.language);
  public language$ = this.language.asObservable();

  private endpointUrl = environment.midgard_endpoint;
  private thornodeEndpointUrl = environment.thornode_endpoint;

  public setLanguage(lang: string) {
    this.language.next(lang);
    localStorage.setItem('dcf_lang', lang);
  }

  public setLPwallet(wallet: string) {
    this.LPwallet.next(wallet);
  }

  public setOriginalDCFTotals(totals: Totals[]) {
    this.originalDCFTotals.next(totals);
  }

  public setMCCNTrackingLiquidity(MCCNTrackingLiquidity: LiquidityTrack) {
    this.MCCNTrackingLiquidity.next(MCCNTrackingLiquidity);
  }

  public setLPResume(LPResume: Resume) {
    this.LPResume.next(LPResume);
  }

  public setNONLPResume(NONLPResume: Resume) {
    this.NONLPResume.next(NONLPResume);
  }

  public setWalleLiquidity(walletLiquidity: WalletLiquidity) {
    this.walletLiquidity.next(walletLiquidity);
  }

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

  private setOriginalPools(pools: MidgardPool[]) {
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

  async getPools(currency: string) {
    const poolsCall = await this.http
      .get(dfc_api + 'midgard/pools/network/' + this.dcf_networkPath + '/')
      .toPromise();
    const depthCall = await this.http
      .get(
        dfc_api +
          'midgard/history/depths/time/last7day/network/' +
          this.dcf_networkPath +
          '/'
      )
      .toPromise();

    return this.createPoolList(
      poolsCall as MidgardPool[],
      depthCall as DepthPriceHistory[],
      currency
    );
  }

  public getAssetAPY(interval: string): Observable<HistoryField[]> {
    return this.http.get<HistoryField[]>(
      `${dfc_api}history/field/roi/time/${interval}/network/${this.dcf_networkPath}/`
    );
  }
  public getAssetPrice(interval: string): Observable<HistoryField[]> {
    return this.http.get<HistoryField[]>(
      `${dfc_api}history/field/price/time/${interval}/network/${this.dcf_networkPath}/`
    );
  }

  public getAssetMembers(interval: string): Observable<HistoryField[]> {
    return this.http.get<HistoryField[]>(
      `${dfc_api}history/field/stakers/time/${interval}/network/${this.dcf_networkPath}/`
    );
  }

  public getHeatlh(): Observable<Health> {
    return this.http.get<Health>(`${this.endpointUrl}health/`);
  }

  public getThornodeHeatlh(): Observable<Ping> {
    const endpoint = environment.thornode_endpoint;
    return this.http.get<Ping>(`${endpoint}ping`);
  }

  public getInboundAddresses(): Observable<InboundAddresses[]> {
    return this.http.get<InboundAddresses[]>(
      `${this.thornodeEndpointUrl}inbound_addresses`
    );
  }

  public getQueue(): Observable<Queue> {
    return this.http.get<Queue>(`${this.thornodeEndpointUrl}queue`);
  }

  public getStats(): Observable<Stats> {
    return this.http
      .get<Stats>(`${this.endpointUrl}stats/`)
      .pipe(map((stats: Stats) => this.setStats(stats)));
  }

  setStats(stats: Stats): Stats {
    this.originalStats.next(stats);
    return stats;
  }

  public getNetwork(): Observable<Network> {
    return this.http.get<Network>(`${this.endpointUrl}network/`);
  }

  public getBalance(address: string): Observable<WalletBalance[]> {
    return this.http.get<WalletBalance[]>(
      `${dfc_api}balance/address/${address}/`
    );
  }

  async getBalanceFromXchain(
    wallet: WalletData,
    currency: string
  ): Promise<any> {
    let client;
    if (wallet.chain == 'BTC') {
      client = this.mockClientService.mockBtcClient;
    } else if (wallet.chain == 'BNB') {
      client = this.mockClientService.mockBinanceClient;
    } else if (wallet.chain == 'BCH') {
      client = this.mockClientService.mockBchClient;
    } else if (wallet.chain == 'LTC') {
      client = this.mockClientService.mockLtcClient;
    } else if (wallet.chain == 'ETH') {
      client = this.mockClientService.mockEthereumClient;
    } else if (wallet.chain == 'THOR') {
      client = this.mockClientService.mockThorchainClient;
    } else if (wallet.chain == 'DOGE') {
      client = this.mockClientService.mockDogeClient;
    }

    console.log(wallet.chain);
    const isValid = client.validateAddress(wallet.address);
    if (isValid == true) {
      const balance = await client.getBalance(wallet.address);

      const walletBalances: WalletBalance[] = [];
      if (
        wallet.chain == 'BTC' ||
        wallet.chain == 'LTC' ||
        wallet.chain == 'ETH'
      ) {
        /*let btc = await this.mockClientService.mockBtcClient.getBalance(
          wallet.address
        );
        btc[0].amount.amount().div(Math.pow(10, 8))*/
        if (balance.length > 0) {
          for (let i = 0; i < balance.length; i++) {
            const amount =
              wallet.chain == 'BTC' || wallet.chain == 'LTC'
                ? balance[i].amount.amount().div(Math.pow(10, 8)).toString()
                : balance[i].amount.amount().toString();
            const asset =
              wallet.chain == 'ETH'
                ? balance[i].asset.chain + '.' + balance[i].asset.symbol
                : balance[i].asset.symbol;
            const walletBalance: WalletBalance = {
              amount: amount,
              asset: asset,
            };
            walletBalances.push(walletBalance);
          }
        } else {
          const walletBalance: WalletBalance = {
            amount: 0,
            asset: wallet.chain + '.' + wallet.chain,
          };
          walletBalances.push(walletBalance);
        }
      }
      //consoleLog(wallet.chain, balance, walletBalances);

      if (walletBalances.length > 0) {
        this.originalPools$.subscribe((pools) => {
          if (pools != null) {
            return this.createBalance(wallet, walletBalances, currency);
          }
        });
      }
    }
  }

  async findBalance(wallet: WalletData, currency: string): Promise<any> {
    let network = this.dcf_networkPath;
    if (network == 'multichain_testnet') {
      network = 'testnet';
    } else {
      network = 'mainnet';
    }

    let BCall: WalletBalance[];
    BCall = await this.http
      .get<WalletBalance[]>(
        `${dfc_api}balance/address/${wallet.address}/network/${network}/`
      )
      .toPromise();
    const balanceCall = BCall;
    if (Array.isArray(balanceCall)) {
      this.originalPools$.subscribe((pools) => {
        if (pools != null) {
          return this.createBalance(wallet, balanceCall, currency);
        }
      });
    } else {
      if (
        wallet.chain == 'LTC' &&
        this.dcf_networkPath != 'multichain_testnet'
      ) {
        const ltcCall = await this.http
          .get<LTCBalance>(
            `https://api.blockcypher.com/v1/ltc/main/addrs/${wallet.address}/balance`
          )
          .toPromise();
        BCall = [{ asset: 'LTC', amount: ltcCall.balance / Math.pow(10, 8) }];
        this.originalPools$.subscribe((pools) => {
          if (pools != null) {
            return this.createBalance(wallet, BCall, currency);
          }
        });
      }
    }
  }

  createBalance(
    wallet: WalletData,
    balance: WalletBalance[],
    currency: string
  ) {
    const details = this.walletData.value;
    wallet.balance = balance;
    wallet.totalBalance = this.createResumeByWallet(wallet, currency);
    if (details == null) {
      this.walletData.next([wallet]);
    } else {
      const duplicated = details.filter(
        (wallets) => wallets.address == wallet.address
      );
      if (duplicated.length == 0) {
        details.push(wallet);
        details.sort(orderWalletDataByType);
        this.walletData.next(details);
      }
    }

    this.createResume(currency);
  }

  createResumeByWallet(wallet: WalletData, currency: string): number {
    if (this.originalPools == null) {
      return;
    }
    const BTCpool = this.originalPools.value.filter(
      (pool) => pool.asset.name == 'BTC.BTC'
    );
    const runePriceUSD = +BTCpool[0].asset_price_usd / +BTCpool[0].asset_price;
    let resume = 0;

    if (wallet.chain == 'LTC') {
      const LTCpool = this.originalPools.value.filter(
        (pool) => pool.asset.name == 'LTC.LTC'
      );
      const amount =
        Array.isArray(wallet.balance) && wallet.balance[0].amount
          ? wallet.balance[0].amount
          : 0;
      resume = resume + +LTCpool[0].asset_price * amount;
    } else if (wallet.chain == 'BTC') {
      const amount = wallet.balance[0].amount ? wallet.balance[0].amount : 0;
      resume = resume + +BTCpool[0].asset_price * amount;
    } else if (wallet.chain == 'BCH') {
      const BCHpool = this.originalPools.value.filter(
        (pool) => pool.asset.name == 'BCH.BCH'
      );
      const amount = wallet.balance[0].amount
        ? wallet.balance[0].amount / 100000000
        : 0;
      resume = resume + +BCHpool[0].asset_price * amount;
    } else if (wallet.chain == 'THOR') {
      const amount = wallet.balance[0]?.amount
        ? wallet.balance[0].amount / 100000000
        : 0;
      resume = resume + +amount;
    } else if (wallet.chain == 'ETH') {
      for (let x = 0; x < wallet.balance.length; x++) {
        if (wallet.balance[x].asset.includes('RUNE') == true) {
          resume =
            resume +
            +wallet.balance[x].amount / Math.pow(10, Math.pow(10, ETH_DECIMAL));
        } else {
          const ETHpool = this.originalPools.value.filter((pool) =>
            pool.asset.name.includes(wallet.balance[x].asset)
          );
          let exponent = Math.pow(10, ETH_DECIMAL);
          if (wallet.balance[x].asset == 'ETH.USDT') {
            exponent = 1000000;
          }
          if (wallet.balance[x].asset == 'ETH.USDC') {
            exponent = 1000000000;
            // const asset_ = new Asset(wallet.balance[x].asset);
            // let provider;
            // getDecimal(asset_,provider);
          }
          if (ETHpool.length > 0) {
            resume =
              resume +
              +ETHpool[0].asset_price * (+wallet.balance[x].amount / exponent);
          }
        }
      }
    } else if (wallet.chain == 'BNB') {
      for (let x = 0; x < wallet.balance.length; x++) {
        if (wallet.balance[x].asset.includes('RUNE') == true) {
          resume = resume + +wallet.balance[x].amount;
        } else {
          const BNBpool = this.originalPools.value.filter(
            (pool) => pool.asset.name == 'BNB.' + wallet.balance[x].asset
          );
          if (BNBpool.length > 0) {
            resume =
              resume + +BNBpool[0].asset_price * +wallet.balance[x].amount;
          }
        }
      }
    } else if (wallet.chain == 'DOGE') {
      const DOGEpool = this.originalPools.value.filter(
        (pool) => pool.asset.name == 'DOGE.DOGE'
      );
      const amount = wallet.balance[0].amount ? wallet.balance[0].amount : 0;
      resume = resume + +DOGEpool[0].asset_price * amount;
    }

    if (currency != 'RUNE') {
      resume = resume * runePriceUSD;
    }

    return resume;
  }

  createResume(currency: string) {
    const details = this.walletData.value;
    this.originalPools$.subscribe((pools) => {
      if (pools != null) {
        const BTCpool = pools.filter((pool) => pool.asset.name == 'BTC.BTC');
        const runePriceUSD =
          +BTCpool[0].asset_price_usd / +BTCpool[0].asset_price;
        let resume = 0;
        for (let i = 0; i < details?.length; i++) {
          if (details[i].chain == 'LTC') {
            const LTCpool = pools.filter(
              (pool) => pool.asset.name == 'LTC.LTC'
            );
            const amount =
              Array.isArray(details[i].balance) && details[i].balance[0].amount
                ? details[i].balance[0].amount
                : 0;
            resume = resume + +LTCpool[0].asset_price * amount;
            details[i].explorerURL =
              'https://blockchair.com/litecoin/address/' + details[i].address;
          } else if (details[i].chain == 'BTC') {
            const amount = details[i].balance[0].amount
              ? details[i].balance[0].amount
              : 0;
            resume = resume + +BTCpool[0].asset_price * amount;
            details[i].explorerURL =
              'https://blockchair.com/bitcoin/address/' + details[i].address;
          } else if (details[i].chain == 'BCH') {
            const BCHpool = pools.filter(
              (pool) => pool.asset.name == 'BCH.BCH'
            );
            const amount = details[i].balance[0].amount
              ? details[i].balance[0].amount / 100000000
              : 0;
            resume = resume + +BCHpool[0].asset_price * amount;
            details[i].explorerURL =
              'https://www.blockchain.com/es/bch/address/' + details[i].address;
          } else if (details[i].chain == 'THOR') {
            const amount = details[i].balance[0].amount
              ? +details[i].balance[0].amount / 100000000
              : 0;
            resume = resume + +amount;
            details[i].explorerURL =
              'https://thorchain.net/#/address/' + details[i].address;
          } else if (details[i].chain == 'ETH') {
            for (let x = 0; x < details[i].balance.length; x++) {
              if (details[i].balance[x].asset.includes('RUNE') == true) {
                resume =
                  resume +
                  +details[i].balance[x].amount / Math.pow(10, ETH_DECIMAL);
              } else {
                const ETHpool = pools.filter((pool) =>
                  pool.asset.name.includes(details[i].balance[x].asset)
                );
                let exponent = Math.pow(10, ETH_DECIMAL);
                if (details[i].balance[x].asset == 'ETH.USDT') {
                  exponent = 1000000;
                }
                if (details[i].balance[x].asset == 'ETH.USDC') {
                  exponent = 1000000000;
                }
                if (ETHpool.length > 0) {
                  resume =
                    resume +
                    +ETHpool[0].asset_price *
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
                const BNBpool = pools.filter(
                  (pool) =>
                    pool.asset.name == 'BNB.' + details[i].balance[x].asset
                );
                if (BNBpool.length > 0) {
                  resume =
                    resume +
                    +BNBpool[0].asset_price * +details[i].balance[x].amount;
                }
              }
            }

            details[i].explorerURL =
              'https://explorer.binance.org/address/' + details[i].address;
          } else if (details[i].chain == 'DOGE') {
            const DOGEpool = pools.filter(
              (pool) => pool.asset.name == 'DOGE.DOGE'
            );
            const amount = details[i].balance[0].amount
              ? details[i].balance[0].amount
              : 0;
            resume = resume + +DOGEpool[0].asset_price * amount;
            details[i].explorerURL =
              'https://blockchair.com/dogecoin/address/' + details[i].address;
          }
        }

        if (currency == 'USD') {
          resume = resume * runePriceUSD;
        }

        this.walletResume.next(resume);
      }
    });
  }

  public getPoolStats(asset: string, period: string): Observable<PoolStats> {
    return this.http.get<PoolStats>(
      `${this.endpointUrl}pool/${asset}/stats?period=${period}`
    );
  }

  public getDCFTotals(period: string): Observable<Totals> {
    return this.http.get<Totals>(
      `${dfc_api}history/total/time/${period}/network/${this.dcf_networkPath}/`
    );
  }

  public getStatsDetail(
    asset: string,
    period: string,
    currency: string,
    id: number
  ): Observable<any> {
    return this.http
      .get<DCFPoolStats[]>(
        `${dfc_api}pool/detail/asset/${id}/time/${period}/network/${this.dcf_networkPath}/`
      )
      .pipe(
        map((pool: DCFPoolStats[]) =>
          this.createDetailList(pool[0], asset, currency)
        )
      );
  }

  createDetailList(
    pool: DCFPoolStats,
    assetName: string,
    currency: string
  ): PoolDetail[] {
    const rank = 0;
    const asset = new Asset(assetName);
    let runePriceBUSD = pool.asset_price_usd / pool.asset_price;
    if (currency == 'RUNE') {
      runePriceBUSD = 1;
    }
    const name = asset.ticker;
    const chain = asset.chain;
    const depth = this.calculateDepth(
      pool.rune_depth,
      pool.asset_depth,
      pool.asset_price_usd,
      runePriceBUSD,
      currency
    );
    const price = this.calculatePrice(
      currency,
      pool.asset_price_usd,
      pool.asset_price
    );
    const volume = this.calculateVolume(
      currency,
      pool.swap_volume,
      runePriceBUSD
    );

    const avgSwapFee = this.calculateAvgSwapFee(
      pool.total_fees,
      pool.swap_count,
      this.calculateVolume('RUNE', pool.swap_volume, runePriceBUSD) /
        pool.swap_count
    );

    let perc = 0;
    let weeklyChange = 0;
    const swaps = pool.swap_count;
    const buys = pool.to_asset_volume * runePriceBUSD;
    const sells = pool.to_rune_volume * runePriceBUSD;
    const swapFee = avgSwapFee;
    const members = pool.unique_member_count;
    const apy = pool.pool_apy;
    const swapSize = (volume / swaps) * runePriceBUSD;
    const isLoading = false;
    const status = pool.status;

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
          data: ['150', '230', '224', '218', '135', '147', '260'],
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

    const depthPrice = this.originalPriceChange.value.filter(
      (pool) => pool.asset.name == asset.fullname
    );

    // consoleLog(this.originalPriceChange.value, depthPrice);

    const priceList = [];
    let graphColor = '';
    if (depthPrice.length > 0 && depthPrice[0].intervals != null) {
      for (let y = 0; y < depthPrice[0].intervals.length; y++) {
        let assetPrice = 0;
        if (currency == 'USD') {
          assetPrice = +depthPrice[0].intervals[y].asset_price_usd;
        } else {
          assetPrice = +depthPrice[0].intervals[y].asset_price;
        }
        priceList.push(assetPrice.toFixed(4));
      }
      const priceListLenght = priceList.length;
      // price diff for 24H
      const priceDiff =
        +priceList[priceListLenght - 1] - +priceList[priceListLenght - 2];
      const priceChange =
        +priceList[priceListLenght - 2] == 0
          ? 0
          : (priceDiff / +priceList[priceListLenght - 2]) * 100;
      // price diff for 7D
      const priceDiff7D = +priceList[priceListLenght - 1] - +priceList[0];
      const priceChange7D = (priceDiff7D / +priceList[0]) * 100;
      perc = priceChange;
      weeklyChange = priceChange7D;
      //this to avoid infinite values
      if (+priceList[0] == 0) {
        weeklyChange = 100;
      }
      if (+priceList[priceListLenght - 2] == 0) {
        perc = 100;
      }
      if (priceChange7D > 0) {
        graphColor = '103, 157, 85';
      } else if (priceChange == 0) {
        graphColor = '255, 149, 0';
      } else {
        graphColor = '241, 56, 56';
      }
      graph = {
        grid: {
          height: 40,
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
          min: this.getMinValue(priceList),
          show: false,
        },
        series: [
          {
            data: priceList,
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: {
              normal: {
                color: 'rgba(' + graphColor + ', 1)',
              },
            },
            areaStyle: {
              normal: {
                color: new graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(' + graphColor + ', 1)' },
                  { offset: 0.7, color: 'rgba(' + graphColor + ', 0.5)' },
                  { offset: 1, color: 'rgba(255, 255, 255, 0)' },
                ]),
              },
            },
          },
        ],
      };
    }

    const poolDetail: PoolDetail[] = [
      {
        rank: rank,
        name: name,
        asset: asset,
        chain: chain,
        price: price,
        depth: depth,
        volume: volume,
        perc: perc,
        weeklyChange: weeklyChange,
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

  createPoolList(
    pools: MidgardPool[],
    depthPricePools: DepthPriceHistory[],
    currency: string
  ): MarketPool[] {
    const orderedPools = this.orderTableByFieldDesc(
      pools,
      'rune_depth',
      currency
    );

    if (this.originalPools.value === null) {
      this.setOriginalPools(pools);
      this.setOriginalPriceChange(depthPricePools);
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
          data: ['150', '230', '224', '218', '135', '147', '260'],
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

    const poolList: MarketPool[] = [];

    for (const index in orderedPools) {
      const runePriceBUSD =
        +orderedPools[index].asset_price_usd / +orderedPools[index].asset_price;
      const asset = new Asset(orderedPools[index].asset.name);
      const depthPrice = depthPricePools.filter(
        (pool) => pool.asset.name == orderedPools[index].asset.name
      );
      const apy = +orderedPools[index].pool_apy;
      const depth = this.calculateDepth(
        +orderedPools[index].rune_depth,
        +orderedPools[index].asset_depth,
        +orderedPools[index].asset_price_usd,
        runePriceBUSD,
        currency
      );
      const price = this.calculatePrice(
        currency,
        +orderedPools[index].asset_price_usd,
        +orderedPools[index].asset_price
      );
      const volume = this.calculateVolume(
        currency,
        +orderedPools[index].volume24h,
        runePriceBUSD
      );

      let perc = 0;
      let weeklyChange = 0;

      const priceList = [];
      let graphColor = '';
      if (depthPrice.length > 0 && depthPrice[0].intervals != null) {
        for (let y = 0; y < depthPrice[0].intervals.length; y++) {
          let assetPrice = 0;
          if (currency == 'USD') {
            assetPrice = +depthPrice[0].intervals[y].asset_price_usd;
          } else {
            assetPrice = +depthPrice[0].intervals[y].asset_price;
          }

          priceList.push(assetPrice.toFixed(4));
        }

        const priceListLenght = priceList.length;

        // price diff for 24H
        const priceDiff =
          +priceList[priceListLenght - 1] - +priceList[priceListLenght - 2];
        const priceChange =
          +priceList[priceListLenght - 2] == 0
            ? 0
            : (priceDiff / +priceList[priceListLenght - 2]) * 100;

        // price diff for 7D
        const priceDiff7D = +priceList[priceListLenght - 1] - +priceList[0];
        const priceChange7D = (priceDiff7D / +priceList[0]) * 100;

        perc = priceChange;
        weeklyChange = priceChange7D;

        //this to avoid infinite values
        if (+priceList[0] == 0) {
          weeklyChange = 100;
        }
        if (+priceList[priceListLenght - 2] == 0) {
          perc = 100;
        }

        if (priceChange7D > 0) {
          graphColor = '103, 157, 85';
        } else if (priceChange == 0) {
          graphColor = '255, 149, 0';
        } else {
          graphColor = '241, 56, 56';
        }

        graph = {
          grid: {
            height: 40,
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
            min: this.getMinValue(priceList),
            show: false,
          },
          series: [
            {
              data: priceList,
              type: 'line',
              smooth: true,
              symbol: 'none',
              lineStyle: {
                normal: {
                  color: 'rgba(' + graphColor + ', 1)',
                },
              },
              areaStyle: {
                normal: {
                  color: new graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(' + graphColor + ', 1)' },
                    { offset: 0.7, color: 'rgba(' + graphColor + ', 0.5)' },
                    { offset: 1, color: 'rgba(255, 255, 255, 0)' },
                  ]),
                },
              },
            },
          ],
        };
      }

      const pool: MarketPool = {
        rank: +index + 1,
        name: asset.ticker,
        asset: asset,
        chain: asset.chain,
        price: price,
        depth: depth,
        apy: apy,
        volume: volume,
        perc: perc,
        weeklyChange: weeklyChange,
        graph: graph,
        status: orderedPools[index].asset.status,
        isLoading: false,
      };

      poolList.push(pool);
    }

    // consoleLog(poolList);

    return poolList;
  }

  getMinValue(priceList: any[]) {
    return priceList.reduce(function (p, v) {
      return +p < +v ? +p : +v;
    });
  }

  calculatePrice(currency: string, assetPriceUSD: number, assetPrice: number) {
    const price = currency == 'RUNE' ? assetPrice : assetPriceUSD;
    return price;
  }

  calculateVolume(currency: string, volume24h: number, runePriceBUSD: number) {
    let volume = currency == 'RUNE' ? volume24h : volume24h * runePriceBUSD;
    volume = isNaN(volume) ? 0 : volume;
    return volume;
  }

  calculateAvgSwapFee(totalFees: number, swaps: number, avgSwapSize: number) {
    let avgSwapFee = ((totalFees / swaps) * 100) / avgSwapSize;
    avgSwapFee = isNaN(avgSwapFee) ? 0 : avgSwapFee;
    return avgSwapFee;
  }

  calculateDepth(
    runeDepth: number,
    assetDepth: number,
    assetPrice: number,
    runePriceBUSD: number,
    currency: string
  ): number {
    let depth = 0;
    if (currency == 'RUNE') {
      depth = runeDepth * 2;
    } else {
      depth = runeDepth * runePriceBUSD + assetDepth * assetPrice;
    }

    depth = isNaN(depth) ? 0 : depth;

    return depth;
  }

  orderTableByFieldDesc(
    pools: MidgardPool[],
    field: string,
    currency: string
  ): MidgardPool[] {
    return Array.from(pools).sort((a: MidgardPool, b: MidgardPool) => {
      const aRunePriceBUSD = +a.asset_price_usd / +a.asset_price;
      const bRunePriceBUSD = +b.asset_price_usd / +b.asset_price;
      const aDepth = this.calculateDepth(
        +a.rune_depth,
        +a.asset_depth,
        +a.asset_price_usd,
        aRunePriceBUSD,
        currency
      );
      const bDepth = this.calculateDepth(
        +b.rune_depth,
        +b.asset_depth,
        +b.asset_price_usd,
        bRunePriceBUSD,
        currency
      );

      if (aDepth > bDepth) {
        return -1;
      } else if (aDepth < bDepth) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  createWalletData(address: string, type: string): WalletData {
    const isBitcoin = this.bitcoinRegex.test(address);
    const isEthereum = this.ethereumRegex.test(address);
    const isBCH = bchRegex({ exact: true }).test(address);
    const isLitecoin = this.litecoinRegex.test(address);
    const isBinance = this.binanceRegex.test(address);
    const isThorchain = this.thorchainRegex.test(address);
    const isDogecoin = this.dogeRegex.test(address);
    let chain = '';
    const mask = this.getMask(address);
    let logo = '';

    if (isBitcoin == true) {
      chain = 'BTC';
      logo =
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
    } else if (isEthereum == true) {
      chain = 'ETH';
      logo =
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/ETH-1C9/logo.png';
    } else if (isBCH == true) {
      chain = 'BCH';
      logo =
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BCH-1FD/logo.png';
    } else if (isLitecoin == true) {
      chain = 'LTC';
      logo =
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/LTC-F07/logo.png';
    } else if (isBinance == true) {
      chain = 'BNB';
      logo =
        '/assets/icons/tokens/asset-bnb.30ddcde6eab16c1b101775001ca5cc45.svg';
    } else if (isThorchain == true) {
      chain = 'THOR';
      logo =
        '/assets/icons/tokens/asset-rune.84d6fe9e6b77ef92d048fe7a44c9370d.svg';
    } else if (isDogecoin == true) {
      chain = 'DOGE';
      logo = '/assets/icons/tokens/dogecoin.b8d7759b60f351e31caf.png';
    }

    const wallet: WalletData = {
      type: type,
      address: address,
      chain: chain,
      mask: mask,
      logo: logo,
    };
    return wallet;
  }

  getMask(address: string) {
    const addressLenght = address.length;
    const mask =
      address.slice(0, 4) +
      '....' +
      address.slice(addressLenght - 4, addressLenght);

    return mask;
  }

  /* SHOW HIDE AMOUNTS SELECTOR */
  setGlobalShowHide(value: boolean) {
    this.globalShowHide.next(value);
  }

  /* NETWORK SELECTOR */
  setGlobalNetwork(network: string) {
    this.globalNetwork.next(network);
  }

  getGlobalNetwork(): Observable<string> {
    return this.globalNetwork.asObservable();
  }

  /* MULTICHAIN LIQUIDITY */

  public getMCCNTrackingLiquidity(
    address: string,
    period: string
  ): Observable<LiquidityTrack> {
    const body = {
      address: address,
    };
    const setTrackingSub = this.http
      .post(
        `${dfc_api}history/tracking_liquidity/address/${address}/network/${this.dcf_networkPath}/`,
        body
      )
      .subscribe((data) => {
        const sub: Subscription = setTrackingSub;
        sub.unsubscribe();
        //trigger plausible custom event
        plausible('Liquidity');
      });

    return this.http
      .get<LiquidityTrack>(
        `${dfc_api}history/tracking_liquidity/address/${address}/time/${period}/network/${this.dcf_networkPath}/`
      )
      .pipe(
        map((liquidity: LiquidityTrack) =>
          this.processMCCNLiquidityTrack(liquidity)
        )
      );
  }

  public processMCCNLiquidityTrack(liquidity: LiquidityTrack): LiquidityTrack {
    this.MCCNTrackingLiquidity.next(liquidity);

    return liquidity;
  }

  /* MULTICHAIN LIQUIDITY */

  public getMultichainLPData(address: string): Observable<WalletLiquidity> {
    if (address.length == 0) {
      return;
    }

    return this.http
      .get<WalletLiquidity>(
        `${dfc_api}summary/liquidity/address/${address}/network/${this.dcf_networkPath}`
      )
      .pipe(
        map((liquidity: WalletLiquidity) => this.processMCCNData(liquidity))
      );
  }

  public processMCCNData(liquidity: WalletLiquidity): WalletLiquidity {
    for (const pool in liquidity.pools) {
      liquidity.pools[pool].pool_name = new Asset(pool);
    }

    this.walletLiquidity.next(liquidity);

    return liquidity;
  }

  public getResumeMCCN(
    liquidity: WalletLiquidity,
    address: string,
    currency: string,
    showHideToggle: boolean
  ) {
    this.walletData$.subscribe((walletData) => {
      if (walletData != null) {
        const walletResumeBalance = walletData.filter(
          (wallet) => wallet.address == address
        );

        let walletResumeValue = 0;
        if (walletResumeBalance.length > 0) {
          walletResumeValue = this.createResumeByWallet(
            walletData.filter((wallet) => wallet.address == address)[0],
            currency
          );
          this.createResumeMCCN(
            liquidity,
            currency,
            walletResumeValue,
            showHideToggle
          );
        } else {
          this.getBalance(address).subscribe(
            (balance) => {
              const walletBalanace = this.createWalletData(address, 'manual');
              walletBalanace.balance = balance;
              walletBalanace.totalBalance = this.createResumeByWallet(
                walletBalanace,
                currency
              );
              this.createResumeMCCN(
                liquidity,
                currency,
                walletBalanace.totalBalance,
                showHideToggle
              );
            },
            (error) => {
              if (error.error.details) {
                if ((error.error.details = 'Thornode connection error')) {
                  consoleLog('Thornode connection error');
                }
              }
              this.createResumeMCCN(
                liquidity,
                currency,
                walletResumeValue,
                showHideToggle
              );
            }
          );
        }
      }
    });
  }

  createResumeMCCN(
    liquidity: WalletLiquidity,
    currency: string,
    walletResumeValue: number,
    showHideToggle: boolean
  ) {
    const piePalette = [
      'rgba(178, 223, 138, 1)',
      'rgba(31, 120, 180, 1)',
      'rgba(51, 160, 44, 1)',
      'rgba(166, 206, 227, 1)',
      'rgba(118, 118, 118, 1)',
      '#22DBBF',
      '#34C73B',
      '#00A2FF',
      '#EB5353',
      '#FF9800',
      '#FFEC3A',
      '#8CC34A',
      '#2096F3',
      '#3F51B5',
      '#673AB7',
      '#002e84',
      '#03E2D9',
      '#D4C65B',
    ];
    let pie: pieSerie[] = [];

    let totalField: string = currency;
    if (totalField == Currency.Asset) {
      totalField = Currency.Usd;
    }

    let totalWalletLP = 0;
    const pieAssets: pieSerie[] = [];
    for (const pool in liquidity.pools) {
      totalWalletLP =
        totalWalletLP +
        liquidity.pools[pool].current_liquidity.total[totalField.toLowerCase()];
    }

    totalWalletLP = totalWalletLP + walletResumeValue;

    for (const pool in liquidity.pools) {
      const assetPerc =
        (liquidity.pools[pool].current_liquidity.total[
          totalField.toLowerCase()
        ] *
          100) /
        totalWalletLP;
      let Amount = this.roundedPipe.transform(
        liquidity.pools[pool].current_liquidity.total[totalField.toLowerCase()]
      );
      Amount = showHideToggle == true ? Amount : '******';
      const poolName = new Asset(pool);
      const pieAsset: pieSerie = {
        value: +assetPerc.toFixed(2),
        name:
          poolName.chain +
          '.' +
          poolName.ticker +
          ' (' +
          +assetPerc.toFixed(2) +
          '%) ' +
          Amount +
          this.getSimbol(currency, true),
        itemStyle: { color: '' },
      };

      pieAssets.push(pieAsset);
    }

    const assetOLPPerc = (walletResumeValue * 100) / totalWalletLP;

    let OLPAmount = this.roundedPipe.transform(walletResumeValue);
    OLPAmount = showHideToggle == true ? OLPAmount : '******';
    const pieOLP: pieSerie = {
      value: +assetOLPPerc.toFixed(2),
      name:
        'Assets Outside LP (' +
        assetOLPPerc.toFixed(2) +
        '%) ' +
        OLPAmount +
        this.getSimbol(currency, true),
      itemStyle: { color: '' },
    };

    pie = pieAssets;
    pie.push(pieOLP);

    for (let z = 0; z < pie.length; z++) {
      if (z < piePalette.length) {
        pie[z].itemStyle.color = piePalette[z];
      } else {
        pie[z].itemStyle = {};
      }
    }

    const resume: Resume = {
      totalWallet: bn(totalWalletLP),
      totalLPPerc: bn(100).minus(assetOLPPerc),
      apy: +liquidity.totals.apy[totalField.toLowerCase()].toFixed(2),
      apw: +liquidity.totals.wpy[currency.toLowerCase()].toFixed(2),
      apd: +liquidity.totals.dpy[currency.toLowerCase()].toFixed(2),
      pie: pie,
    };

    this.LPResume.next(resume);
  }

  getAssetName(asset: string) {
    const fullname = asset;
    let chain: string;
    let symbol: string;
    let ticker: string;
    let iconPath: string;

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

    if (chain == 'ETH' && ticker !== 'ETH') {
      // Find token icons from ethereum network
      const ethMatch = EthIconsFromTrustWallet[ticker];

      if (asset == 'ETH.ALCX-0XDBDB4D16EDA451D0503B854CF79D55697F90C8DF') {
        iconPath = 'https://etherscan.io/token/images/Alchemix_32.png';
      } else if (
        asset == 'ETH.WBTC-0X2260FAC5E5542A773AA44FBCFEDF7C193BC2C599'
      ) {
        iconPath =
          'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=013';
      } else if (
        asset == 'ETH.TGT-0X108A850856DB3F85D0269A2693D896B394C80325'
      ) {
        iconPath =
          'https://app.thorswap.finance/static/media/tgt_logo.f2c774f9.png';
      } else if (asset.includes('ETH.XRUNE') === true) {
        iconPath = 'https://etherscan.io/token/images/xrunetoken_32.png';
      } else if (asset.includes('ETH.UST') === true) {
        iconPath =
          'https://s2.coinmarketcap.com/static/img/coins/64x64/7129.png';
      } else if (asset.includes('ETH.TKN18') === true) {
        iconPath =
          'https://app.thorswap.finance/static/media/asset-rune.84d6fe9e.svg';
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
          case 'DOGE.DOGE':
            iconPath =
              'https://app.thorswap.finance/static/media/dogecoin.b8d7759b.png';
            break;
          default:
            console.warn(
              `Icon not available for poolName ${asset}. Add override in src\\app\\_classes\\asset.ts`
            );
            iconPath =
              'https://app.thorswap.finance/static/media/asset-rune.84d6fe9e.svg';
            break;
        }
      }
    }

    return { fullname, chain, symbol, ticker, iconPath };
  }

  getNonLPResumeMCCN(
    currency: string,
    address: string,
    showHideToggle: boolean
  ) {
    let wallet: WalletData;

    this.walletData$.subscribe((walletData) => {
      if (walletData !== null) {
        wallet = walletData.filter((wallet) => wallet.address == address)[0];

        this.originalPools$.subscribe((pools) => {
          if (pools !== null) {
            if (wallet !== undefined) {
              this.createNONLPDetails(wallet, pools, currency, showHideToggle);
            } else {
              this.getBalance(address).subscribe(
                (balance) => {
                  const walletBalanace = this.createWalletData(
                    address,
                    'manual'
                  );
                  walletBalanace.balance = balance;
                  walletBalanace.totalBalance = this.createResumeByWallet(
                    walletBalanace,
                    currency
                  );
                  this.createNONLPDetails(
                    walletBalanace,
                    pools,
                    currency,
                    showHideToggle
                  );
                },
                (error) => {
                  if (error.error.details) {
                    if (error.error.details == 'Thornode connection error') {
                      consoleLog('Thornode connection error');
                    } else {
                      consoleLog(error.error.details);
                    }
                  }
                  const walletBalanace = this.createWalletData(
                    address,
                    'manual'
                  );
                  walletBalanace.balance = [];
                  walletBalanace.totalBalance = this.createResumeByWallet(
                    walletBalanace,
                    currency
                  );
                  this.createNONLPDetails(
                    walletBalanace,
                    pools,
                    currency,
                    showHideToggle
                  );
                }
              );
            }
          }
        });
      }
    });
  }

  createNONLPDetails(
    wallet: WalletData,
    pools: MidgardPool[],
    currency: string,
    showHideToggle: boolean
  ) {
    const piePalette = [
      'rgba(178, 223, 138, 1)',
      'rgba(31, 120, 180, 1)',
      'rgba(51, 160, 44, 1)',
      'rgba(166, 206, 227, 1)',
      'rgba(118, 118, 118, 1)',
    ];

    let pie: pieSerie[] = [];

    let totalWalletLP = bn(0);
    let NONLPDetails: NONLPDetail[] = [];
    const BTCpool = pools.filter((pool) => pool.asset.name == 'BTC.BTC');
    const runePriceUSD = +BTCpool[0].asset_price_usd / +BTCpool[0].asset_price;

    if (wallet.chain === 'LTC') {
      const LTCpool = this.originalPools.value.filter(
        (pool) => pool.asset.name === 'LTC.LTC'
      );
      const LTCpoolName = new Asset(LTCpool[0].asset.name);
      NONLPDetails = [
        {
          chain: wallet.chain,
          asset: LTCpoolName,
          value: +LTCpool[0].asset_price * wallet.balance[0].amount,
        },
      ];
    } else if (wallet.chain === 'BTC') {
      const BTCpoolName = new Asset(BTCpool[0].asset.name);
      NONLPDetails = [
        {
          chain: wallet.chain,
          asset: BTCpoolName,
          value: +BTCpool[0].asset_price * wallet.balance[0].amount,
        },
      ];
    } else if (wallet.chain === 'BCH') {
      const BCHpool = this.originalPools.value.filter(
        (pool) => pool.asset.name === 'BCH.BCH'
      );
      const BCHpoolName = new Asset(BCHpool[0].asset.name);
      NONLPDetails = [
        {
          chain: wallet.chain,
          asset: BCHpoolName,
          value:
            +BCHpool[0].asset_price * (wallet.balance[0].amount / 100000000),
        },
      ];
    } else if (wallet.chain === 'THOR') {
      const THORpoolName: AssetName = {
        chain: 'THOR',
        fullname: 'THOR.RUNE',
        iconPath:
          'https://app.thorswap.finance/static/media/asset-rune.84d6fe9e.svg',
        symbol: 'RUNE',
        ticker: 'RUNE',
      };
      NONLPDetails = [
        {
          chain: wallet.chain,
          asset: THORpoolName,
          value: +wallet.balance[0].amount / 100000000,
        },
      ];
    } else if (wallet.chain === 'ETH') {
      for (let x = 0; x < wallet.balance.length; x++) {
        if (wallet.balance[x].asset.includes('RUNE') == true) {
          const THORpoolName: AssetName = {
            chain: 'ETH',
            fullname: 'ETH.RUNE',
            iconPath:
              'https://app.thorswap.finance/static/media/asset-rune.84d6fe9e.svg',
            symbol: 'RUNE',
            ticker: 'RUNE',
          };
          NONLPDetails.push({
            chain: wallet.chain,
            asset: THORpoolName,
            value: +wallet.balance[x].amount / Math.pow(10, ETH_DECIMAL),
          });
        } else {
          const ETHpool = this.originalPools.value.filter((pool) =>
            pool.asset.name.includes(wallet.balance[x].asset)
          );
          let exponent = Math.pow(10, ETH_DECIMAL);
          if (wallet.balance[x].asset == 'ETH.USDT') {
            exponent = 1000000;
          }
          if (wallet.balance[x].asset == 'ETH.USDC') {
            exponent = 1000000000;
          }
          if (ETHpool.length > 0) {
            const ETHpoolName = new Asset(ETHpool[0].asset.name);
            NONLPDetails.push({
              chain: wallet.chain,
              asset: ETHpoolName,
              value:
                +ETHpool[0].asset_price *
                (+wallet.balance[x].amount / exponent),
            });
          }
        }
      }
    } else if (wallet.chain === 'BNB') {
      for (let x = 0; x < wallet.balance.length; x++) {
        if (wallet.balance[x].asset.includes('RUNE') == true) {
          const BNBpoolName: AssetName = {
            chain: 'BNB',
            fullname: 'BNB.RUNE',
            iconPath:
              'https://app.thorswap.finance/static/media/asset-rune.84d6fe9e.svg',
            symbol: 'RUNE',
            ticker: 'RUNE',
          };
          NONLPDetails.push({
            chain: wallet.chain,
            asset: BNBpoolName,
            value: +wallet.balance[x].amount,
          });
        } else {
          const BNBpool = this.originalPools.value.filter(
            (pool) => pool.asset.name === 'BNB.' + wallet.balance[x].asset
          );
          if (BNBpool.length > 0) {
            const BNBpoolName = new Asset(BNBpool[0].asset.name);
            NONLPDetails.push({
              chain: wallet.chain,
              asset: BNBpoolName,
              value: +BNBpool[0].asset_price * +wallet.balance[x].amount,
            });
          }
        }
      }
    }

    if (currency === 'USD') {
      for (let i = 0; i < NONLPDetails.length; i++) {
        NONLPDetails[i].value = NONLPDetails[i].value * runePriceUSD;
      }
    }

    for (let i = 0; i < NONLPDetails.length; i++) {
      totalWalletLP = totalWalletLP.plus(NONLPDetails[i].value);
    }

    const pieAssets: pieSerie[] = [];
    for (let x = 0; x < NONLPDetails.length; x++) {
      let assetPerc = (NONLPDetails[x].value * 100) / totalWalletLP.toNumber();
      if (totalWalletLP.toNumber() == 0) {
        assetPerc = 100;
      }

      let Amount = this.roundedPipe.transform(NONLPDetails[x].value);
      Amount = showHideToggle == true ? Amount : '******';
      const pieAsset: pieSerie = {
        value: +assetPerc.toFixed(2),
        name:
          NONLPDetails[x].chain +
          '.' +
          NONLPDetails[x].asset.ticker +
          ' (' +
          +assetPerc.toFixed(2) +
          '%) ' +
          Amount +
          this.getSimbol(currency, true),
        itemStyle: { color: '' },
      };

      pieAssets.push(pieAsset);
    }

    if (pieAssets.length == 0) {
      let Amount = '0';
      Amount = showHideToggle == true ? Amount : '******';
      const pieAsset: pieSerie = {
        value: 100,
        name:
          'Empty Wallet (100.00%) ' + Amount + this.getSimbol(currency, true),
        itemStyle: { color: '' },
      };

      pieAssets.push(pieAsset);
    }
    pie = pieAssets;

    for (let z = 0; z < pie.length; z++) {
      if (z < piePalette.length) {
        pie[z].itemStyle.color = piePalette[z];
      } else {
        pie[z].itemStyle = {};
      }
    }

    if (totalWalletLP.toNumber() == 0) {
      totalWalletLP = bn(0.00000001);
    }

    const resume: Resume = {
      totalWallet: totalWalletLP,
      totalLPPerc: bn(0),
      apy: 0,
      apw: 0,
      apd: 0,
      pie: pie,
    };

    this.NONLPResume.next(resume);
  }

  getSimbol(currency: string, flag: boolean) {
    if (currency === 'RUNE') {
      return 'ᚱ';
    } else if (currency === 'BUSD') {
      return '$';
    } else {
      return flag === true ? '$' : '';
    }
  }

  // Func to update wallet balances.
  updateWalletDataBalances() {
    const _walletData = this.walletData.value;
    this.walletData.next(null);
    if (_walletData !== null) {
      for (let i = 0; i < _walletData.length; i++) {
        if (
          environment.network == 'testnet' &&
          (_walletData[i].chain == 'BTC' ||
            _walletData[i].chain == 'DOGE' ||
            _walletData[i].chain == 'ETH' ||
            _walletData[i].chain == 'LTC')
        ) {
          this.getBalanceFromXchain(_walletData[i], this.currency.value);
        } else {
          this.findBalance(_walletData[i], this.currency.value);
        }
        //this.findBalance(_walletData[i], this.currency.value);
      }
    }
  }

  getSP(spData: spData): Observable<spDataResponse> {
    return this.http.post<spDataResponse>(
      `${dfc_api}slippage_applies/`,
      spData
    );
  }
}

function orderWalletDataByType(a: WalletData, b: WalletData) {
  if (a.type < b.type) {
    return -1;
  }
  if (a.type > b.type) {
    return 1;
  }
  return 0;
}
