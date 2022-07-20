import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable()
export class CurrencyService {
  private endpointUrl = environment.endpoint;

  constructor(private http: HttpClient) {}

  public getCurrencies(network: string) {
    return this.http.get<Array<any>>(
      this.endpointUrl + 'top/six/asset/network/' + network
    );
  }
}
