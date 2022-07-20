import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  VolumesTable,
  VolumesData,
  Table,
  Tables,
  PoolHistory,
  Chart,
  AssetPoints,
  Volumes,
  Totals,
} from '../interfaces/volumes';
import {
  CoinIconsFromTrustWallet,
  EthIconsFromTrustWallet,
} from 'src/app/modules/dex/shared/constants/icon-list';
import * as moment from 'moment';

@Injectable()
export class VolumesService {
  private endpointUrl = environment.endpoint;

  private originalVolumes = new BehaviorSubject(null);

  constructor(private http: HttpClient) {}

  public setOriginalVolumesModule(originalVolumes: Volumes) {
    this.originalVolumes.next(originalVolumes);
  }

  public getOriginalVolumesModule() {
    return this.originalVolumes.asObservable();
  }

  /**HISTORY */

  public getHistory(
    field: string,
    period: string,
    network: string
  ): Observable<any> {
    return this.http
      .get<PoolHistory[]>(
        this.endpointUrl +
          'history/field/' +
          field +
          '/time/' +
          period +
          '/network/' +
          network +
          '/'
      )
      .pipe(map((data) => this.processHistoryData(data, network, field)));
  }

  processHistoryData(
    poolHistory: PoolHistory[],
    network: string,
    field: string
  ): Chart {
    let enableStatus = 'enabled';
    let filtered = poolHistory.filter(
      (pool) => pool.asset.status == enableStatus
    );

    enableStatus = 'available';
    filtered = poolHistory.filter((pool) => pool.asset.status == enableStatus);

    let assetName = filtered[0].asset.name;
    let value: any;
    let chart: Chart;

    let assetPoint: AssetPoints = {
      asset: this.getAssetName(assetName).nameChain,
      points: [],
    };

    let assetPoints: AssetPoints[] = [];
    let labels: string[] = [];
    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i].asset.name != assetName) {
        assetPoints.push(assetPoint);
        labels.push(this.getAssetName(assetName).nameChain);
        assetName = filtered[i].asset.name;
        assetPoint = {
          asset: this.getAssetName(assetName).nameChain,
          points: [],
        };
      }

      if (field == 'slipaverage') {
        let arrayValue = filtered[i].value * 100;

        if (network == 'multichain_chaosnet') {
          arrayValue = filtered[i].value;
        }

        value = [
          moment(filtered[i].time).format('MM/DD/YYYY HH:[00]'),
          arrayValue.toFixed(2),
        ];
      } else if (field == 'swaps') {
        value = [
          moment(filtered[i].time).format('MM/DD/YYYY HH:[00]'),
          filtered[i].value.toFixed(2),
        ];
      } else {
        value = [
          moment(filtered[i].time).format('MM/DD/YYYY HH:[00]'),
          (filtered[i].value / 100000000).toFixed(2),
        ];
      }

      assetPoint.points.push(value);
    }

    chart = {
      labels: labels,
      assetPoints: assetPoints,
    };

    return chart;
  }

  /** TOTALS */
  public getTotals(period: string, network: string): Observable<Totals> {
    return this.http.get<Totals>(
      this.endpointUrl +
        'history/total/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  /** Service to get PoolRates Data Table */
  public getVolumesTable(period: string, network: string) {
    return this.http
      .get<VolumesData[]>(
        this.endpointUrl +
          'history/total/pools/time/' +
          period +
          '/network/' +
          network +
          '/'
      )
      .pipe(map((data) => this.processVolumesTable(data, network)));
  }

  processVolumesTable(volumesData: VolumesData[], network: string): Tables {
    let enableStatus = 'enabled';
    let filtered = volumesData.filter(
      (pool) => pool.asset.status == enableStatus
    );
    if (network == 'multichain_chaosnet') {
      enableStatus = 'available';
      filtered = volumesData.filter(
        (pool) => pool.asset.status == enableStatus
      );
    }

    let volumeTable: Table[] = [];
    let depthTable: Table[] = [];
    let swapsTable: Table[] = [];
    let buyvolumeTable: Table[] = [];
    let sellvolumeTable: Table[] = [];
    let avgswapsizeTable: Table[] = [];
    let slipaverageTable: Table[] = [];

    for (let i = 0; i < filtered.length; i++) {
      let rank = i + 1;
      let asset = this.getAssetName(filtered[i].asset.name);
      let volumeValue = filtered[i].volume;
      let depthValue = filtered[i].depth;
      let swapsValue = filtered[i].swaps;
      let buyvolumeValue = filtered[i].buyvolume;
      let sellvolumeValue = filtered[i].sellvolume;
      let avgswapsizeValue = filtered[i].avgswapsize;
      let slipaverageValue = filtered[i].slipaverage;

      let volumeRow = { rank: rank, asset: asset, value: volumeValue };
      let depthRow = { rank: rank, asset: asset, value: depthValue };
      let swapsRow = { rank: rank, asset: asset, value: swapsValue };
      let buyvolumeRow = { rank: rank, asset: asset, value: buyvolumeValue };
      let sellvolumeRow = { rank: rank, asset: asset, value: sellvolumeValue };
      let avgswapsizeRow = {
        rank: rank,
        asset: asset,
        value: avgswapsizeValue,
      };
      let slipaverageRow = {
        rank: rank,
        asset: asset,
        value: slipaverageValue,
      };

      volumeTable.push(volumeRow);
      depthTable.push(depthRow);
      swapsTable.push(swapsRow);
      buyvolumeTable.push(buyvolumeRow);
      sellvolumeTable.push(sellvolumeRow);
      avgswapsizeTable.push(avgswapsizeRow);
      slipaverageTable.push(slipaverageRow);
    }

    let tables: Tables = {
      volume: volumeTable,
      depth: depthTable,
      swaps: swapsTable,
      buyvolume: buyvolumeTable,
      sellvolume: sellvolumeTable,
      avgswapsize: avgswapsizeTable,
      slipaverage: slipaverageTable,
    };

    return tables;
  }

  orderTableByROIDesc(poolratesTable: VolumesTable[]) {
    return Array.from(poolratesTable).sort((a: any, b: any) => {
      if (a['roi'] > b['roi']) {
        return -1;
      } else if (a['roi'] < b['roi']) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  getAssetName(asset: string) {
    let fullname: string;
    let chain: string;
    let nameChain: string;
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

    nameChain = chain + '.' + ticker;

    const trustWalletMatch = CoinIconsFromTrustWallet[ticker];

    if (chain == 'ETH' && ticker != 'ETH') {
      // Find token icons from ethereum network
      const ethMatch = EthIconsFromTrustWallet[ticker];
      iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${ethMatch}/logo.png`;
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

    return { fullname, nameChain, chain, symbol, ticker, iconPath };
  }

  /** OLD ENDPOINTS */
  /*public getTotalVolumes(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/volume/asset/' + asset + '/time/' + period + '/');
  }

  public getTotalDepth(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/depth/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapNumber(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/swaps/asset/' + asset + '/time/' + period + '/');
  }

  public getVolumeBuys(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/buyvolume/asset/' + asset + '/time/' + period + '/');
  }

  public getVolumeSells(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/sellvolume/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapSize(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/avgswapsize/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapFee(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'total/slipaverage/asset/' + asset + '/time/' + period + '/');
  }*/

  /** DATA TABLES BY ASSETS*/

  /*public getVolumesTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/volume/asset/' + asset + '/time/' + period + '/');
  }

  public getDepthTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/depth/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapNumberTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/swaps/asset/' + asset + '/time/' + period + '/');
  }

  public getVolumeBuysTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/buyvolume/asset/' + asset + '/time/' + period + '/');
  }

  public getVolumeSellsTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/sellvolume/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapSizeTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/avgswapsize/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapFeeTable(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'totalasset/slipaverage/asset/' + asset + '/time/' + period + '/');
  }*/

  /** DATA CHART POINTS BY FIELD*/

  /*public getVolumesChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/volume/asset/' + asset + '/time/' + period + '/');
  }

  public getDepthChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/depth/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapNumberChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/swaps/asset/' + asset + '/time/' + period + '/');
  }

  public getVolumeBuysChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/buyvolume/asset/' + asset + '/time/' + period + '/');
  }

  public getVolumeSellsChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/sellvolume/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapSizeChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/avgswapsize/asset/' + asset + '/time/' + period + '/');
  }

  public getSwapFeeChart(period: string, asset: number){
    return this.http.get(this.endpointUrl + 'field/slipaverage/asset/' + asset + '/time/' + period + '/');
  }*/
}
