import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable()
export class LandingService {
  private endpointUrl = environment.endpoint;

  constructor(private http: HttpClient) {}

  /** TOTALS */
  public getTotals(period: string) {
    return this.http.get(
      this.endpointUrl + 'history/total/time/' + period + '/'
    );
  }

  public getTotalStaked(period: string) {
    return this.http.get(
      this.endpointUrl + 'total/staked/asset/0/time/' + period
    );
  }

  public getTotalStakers(period: string) {
    return this.http.get(
      this.endpointUrl + 'total/stakers/asset/0/time/' + period
    );
  }

  public getTotalRoi(period: string) {
    return this.http.get(this.endpointUrl + 'total/roi/asset/0/time/' + period);
  }

  /** DATA TABLES BY ASSETS*/

  public getStakedTable(period: string) {
    return this.http.get(
      this.endpointUrl + 'totalasset/staked/asset/0/time/' + period
    );
  }

  public getStakersTable(period: string) {
    return this.http.get(
      this.endpointUrl + 'totalasset/stakers/asset/0/time/' + period
    );
  }

  public getRoiTable(period: string) {
    return this.http.get(
      this.endpointUrl + 'totalasset/roi/asset/0/time/' + period
    );
  }

  /* Endpoint to find asset's Depth */
  public getDepthTable(period: string) {
    return this.http.get(
      this.endpointUrl + 'totalasset/depth/asset/0/time/' + period
    );
  }

  /** DATA CHART POINTS BY FIELD*/

  public getStakedChart(period: string) {
    return this.http.get(
      this.endpointUrl + 'field/staked/asset/0/time/' + period
    );
  }

  public getStakersChart(period: string) {
    return this.http.get(
      this.endpointUrl + 'field/stakers/asset/0/time/' + period
    );
  }

  public getRoiChart(period: string) {
    return this.http.get(this.endpointUrl + 'field/roi/asset/0/time/' + period);
  }
}
