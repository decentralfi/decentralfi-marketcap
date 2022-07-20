import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import { Network, PoolHistory, Pool, Chart } from '../interfaces/network';

@Injectable()
export class NetworkService {
  private endpointUrl = environment.endpoint;
  private originalNetwork = new BehaviorSubject(null);

  constructor(private http: HttpClient) {}

  public setOriginalNetwork(originalNetwork: Network) {
    this.originalNetwork.next(originalNetwork);
  }

  public getOriginalNetwork() {
    return this.originalNetwork.asObservable();
  }

  /**HISTORY */

  public getHistory(
    field: string,
    period: string,
    network: string,
    asset: number
  ): Observable<any> {
    return this.http
      .get<PoolHistory>(
        this.endpointUrl +
          'history/' +
          field +
          '/asset/' +
          asset +
          '/time/' +
          period +
          '/network/' +
          network +
          '/'
      )
      .pipe(map((data) => this.processHistoryData(data, field)));
  }

  /** TOTALS */
  public getTotalCapital(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalcapital/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalActiveBonded(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalactivebond/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalStandbyBonded(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalstandbybond/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalReserve(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalreserve/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalStaked(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalstaked/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalActiveNodes(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalactivenode/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalActiveStakers(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalstakers/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalActiveUsers(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalactiveusers/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalBlockReward(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalblockreward/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getTotalBlockHeight(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'total/totalblockheight/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  /** CHARTS */
  public getChartCapital(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalcapital/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartActiveBonded(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalactivebond/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartStandbyBonded(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalstandbybond/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartReserve(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalreserve/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartStaked(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalstaked/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartActiveNodes(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalactivenode/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartActiveStakers(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalstakers/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartActiveUsers(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalactiveusers/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartBlockReward(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalblockreward/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  public getChartBlockHeight(period: string, asset: number) {
    return this.http.get(
      this.endpointUrl +
        'field/totalblockheight/asset/' +
        asset +
        '/time/' +
        period +
        '/'
    );
  }

  /** INCENTIVE PENDULUM */
  public getIncentivePendulum() {
    return this.http.get(this.endpointUrl + 'network/');
  }

  processDataChart(array, label?: string): Chart {
    let outputArray: any[] = [];
    let value: any;

    for (let i = 0; i < array.length; i++) {
      if (
        label == 'totalactivenode' ||
        label == 'totalstakers' ||
        label == 'totalactiveusers' ||
        label == 'totalblockheight'
      ) {
        value = [
          moment(array[i].time).format('MM/DD/YYYY HH:[00]'),
          array[i].value.toFixed(2),
        ];
      } else {
        value = [
          moment(array[i].time).format('MM/DD/YYYY HH:[00]'),
          (array[i].value / 100000000).toFixed(2),
        ];
      }

      if (value) {
        outputArray.push(value);
      }
    }

    let chart: Chart = {
      assetPoints: outputArray,
    };

    return chart;
  }

  processHistoryData(data: PoolHistory, field: string): Pool {
    let pool: Pool = {
      tooltip: '',
      total: 0,
      chart: { assetPoints: [] },
    };
    pool.total = data.total;
    pool.tooltip = data.tooltip;
    pool.chart = this.processDataChart(data[field], field);
    return pool;
  }
}
