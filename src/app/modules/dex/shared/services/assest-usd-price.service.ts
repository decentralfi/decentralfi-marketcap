import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

import { Price } from '@dexShared/classes/price';
import { Asset } from '@dexShared/classes/asset';
import { Pool } from '@dexShared/classes/pool';
import { Amount } from '@dexShared/classes/amount';
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';

@Injectable({
  providedIn: 'root',
})
export class AssestUsdPriceService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    private masterWalletManagerService: MasterWalletManagerService
  ) {
    this.baseUrl = 'https://coincodex.com/api/coincodex/get_coin';
  }

  async calUsdPrice(assetUnit: number, ticker: string): Promise<number> {
    /*const res = await this.http
      .get<any>(`https://api.coinlore.net/api/tickers/?start=0&limit=500`)
      .toPromise();
    const asset = res.data.filter(({ symbol }) => symbol === ticker)[0];*/
    const res =
      await this.masterWalletManagerService.originalPools$.toPromise();
    const asset = res.filter((pool) => pool.asset.name === ticker)[0];
    return assetUnit > 0 ? assetUnit * +asset.asset_price_usd : 0;
  }

  getPrice({
    inputAsset,
    pools,
    inputAmount,
  }: {
    inputAsset: Asset;
    pools: Pool[];
    inputAmount: number;
  }) {
    return new Price({
      baseAsset: inputAsset,
      pools,
      priceAmount: Amount.fromAssetAmount(inputAmount, 8),
    });
  }
}
