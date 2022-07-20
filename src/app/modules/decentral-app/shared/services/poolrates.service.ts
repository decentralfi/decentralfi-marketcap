import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  PoolRatesTable,
  PoolHistory,
  PoolRatesData,
  AssetPoints,
  Chart,
  PoolRates,
  Totals,
} from '../interfaces/poolrates';
// import {
//   CoinIconsFromTrustWallet,
//   EthIconsFromTrustWallet,
// } from 'src/app/modules/dex/shared/constants/icon-list';
import { Asset } from '@dexShared/classes/asset';
import * as moment from 'moment';

@Injectable()
export class PoolratesService {
  private endpointUrl = environment.endpoint;
  private originalPoolRatesTable = new BehaviorSubject(null);
  private originalPoolRates = new BehaviorSubject(null);

  constructor(private http: HttpClient) {}

  private setOriginalPoolRatesTable(originalPoolRatesTable: PoolRatesTable[]) {
    this.originalPoolRatesTable.next(originalPoolRatesTable);
  }

  public getOriginalPoolRatesTable() {
    return this.originalPoolRatesTable.asObservable();
  }

  public setOriginalPoolRatesModule(originalPoolRates: PoolRates) {
    this.originalPoolRates.next(originalPoolRates);
  }

  public getOriginalPoolRatesModule() {
    return this.originalPoolRates.asObservable();
  }

  /**HISTORY */

  public getHistory(
    field: string,
    period: string,
    network: string,
    table: PoolRatesTable[]
  ): Observable<any> {
    //return this.http.get(this.endpointUrl + 'history/' + field + '/asset/' + asset + '/time/' + period + '/');
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
      .pipe(map((data) => this.processHistoryData(data, table, field)));
  }

  processHistoryData(
    poolHistory: PoolHistory[],
    table: PoolRatesTable[],
    field: string
  ): Chart {
    let labels: string[] = [];
    let assetPoint: AssetPoints;
    let assetPoints: AssetPoints[] = [];
    let value: any;
    let chart: Chart;

    for (let i = 0; i < table.length; i++) {
      assetPoint = {
        asset: table[i].asset.chain + '.' + table[i].asset.ticker,
        points: [],
      };

      labels.push(table[i].asset.chain + '.' + table[i].asset.ticker);

      let filtered = poolHistory.filter(
        (pool) => pool.asset.name == table[i].asset.fullname
      );

      for (let y = 0; y < filtered.length; y++) {
        if (field == 'roi') {
          value = [
            moment(filtered[y].time).format('MM/DD/YYYY HH:[00]'),
            (filtered[y].value * 100).toFixed(2),
          ];
        } else if (field == 'stakers') {
          value = [
            moment(filtered[y].time).format('MM/DD/YYYY HH:[00]'),
            filtered[y].value.toFixed(2),
          ];
        } else {
          value = [
            moment(filtered[y].time).format('MM/DD/YYYY HH:[00]'),
            (filtered[y].value / 100000000).toFixed(2),
          ];
        }

        assetPoint.points.push(value);
      }

      assetPoints.push(assetPoint);
    }

    chart = {
      labels: labels,
      assetPoints: assetPoints,
      rawChart: poolHistory,
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

  /** DATA TABLES BY ASSETS*/

  public getStakedTable(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'totalasset/staked/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  public getStakersTable(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'totalasset/stakers/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  public getRoiTable(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'totalasset/roi/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  /* Endpoint to find asset's Depth */
  public getDepthTable(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'totalasset/depth/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  /** DATA CHART POINTS BY FIELD*/

  public getStakedChart(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/staked/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  public getStakersChart(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/stakers/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  public getRoiChart(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/roi/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  public getPriceChart(period: string, network: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/price/asset/' +
        asset +
        '/time/' +
        period +
        '/network/' +
        network +
        '/'
    );
  }

  /** Service to get PoolRates Data Table */
  public getPoolratesTable(period: string, network: string, asset: number) {
    //return this.http.get(this.endpointUrl + 'poolrates/asset/' + asset + '/time/' + period + '/');
    return this.http
      .get<PoolRatesData[]>(
        this.endpointUrl +
          'history/total/pools/time/' +
          period +
          '/network/' +
          network +
          '/'
      )
      .pipe(map((data) => this.processPoolratesTable(data, network)));
  }

  processPoolratesTable(
    poolRatesData: PoolRatesData[],
    network: string
  ): PoolRatesTable[] {
    let poolratesTable: PoolRatesTable[] = [];
    let enableStatus = 'enabled';
    let filtered = poolRatesData.filter(
      (pool) => pool.asset.status == enableStatus
    );
    if (network == 'multichain_chaosnet') {
      enableStatus = 'available';
      filtered = poolRatesData.filter(
        (pool) => pool.asset.status == enableStatus
      );
    }

    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i].asset.status == enableStatus) {
        let poolrate: PoolRatesTable = {
          asset: new Asset(filtered[i].asset.name),
          price: filtered[i].price,
          depth: filtered[i].depth,
          volume: filtered[i].volume,
          swaps: filtered[i].swaps,
          roi: filtered[i].roi,
          stakers: filtered[i].stakers,
          staked: filtered[i].staked,
          slip: filtered[i].slipaverage,
        };

        poolratesTable.push(poolrate);
      }
    }

    let orderedPoolratesTable = this.orderTableByROIDesc(poolratesTable);
    this.setOriginalPoolRatesTable(orderedPoolratesTable);

    return orderedPoolratesTable;
  }

  orderTableByROIDesc(poolratesTable: PoolRatesTable[]) {
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
}
