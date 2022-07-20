import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Fee,
  Fees,
  TransferFee,
  DexFees,
  BinanceClient,
  getPrefix,
  Client as binanceClient,
} from '@xchainjs/xchain-binance';
import { Observable } from 'rxjs';
import { TransferFees } from '../classes/binance-fee';
import { baseAmount } from '@xchainjs/xchain-util';
import { Network } from '@xchainjs/xchain-client';

const network = environment.network;
const defaultThorVersion = environment.defaultThorVersion;

@Injectable({
  providedIn: 'root',
})
export class BinanceService {
  private _baseUrl: string;
  private _asgardexBncClient: BinanceClient;
  public dcf_networkPath = defaultThorVersion + '_' + network;

  get bncClient() {
    return this._asgardexBncClient.getBncClient();
  }

  constructor(private http: HttpClient) {
    /*let networkPath = localStorage.getItem('dcf-network');
    if (networkPath == null) {
      localStorage.setItem('dcf-network', this.dcf_networkPath);
    } else {
      this.dcf_networkPath = networkPath;
    }*/
    //this.dcf_networkPath = localStorage.getItem('dcf-network');

    if (this.dcf_networkPath == 'multichain_testnet') {
      this._baseUrl = 'https://testnet-dex.binance.org/api/v1';
    } else {
      this._baseUrl = 'https://dex.binance.org/api/v1';
    }

    this._asgardexBncClient = new binanceClient({
      network:
        this.dcf_networkPath === 'multichain_testnet'
          ? Network.Testnet
          : Network.Mainnet,
    });
  }

  getBinanceFees(): Observable<Fees> {
    return this.http.get<Fees>(`${this._baseUrl}/fees`);
  }

  getTransferFees(feesData: Fees) {
    const fees = this.getTransferFeeds(feesData);
    if (fees) {
      return fees;
    } else {
      return null;
    }
  }

  getTransferFeeds(fees: Fees): TransferFees {
    return fees.reduce((acc: TransferFees, dataItem) => {
      if (!acc && this.isTransferFee(dataItem)) {
        const single = dataItem.fixed_fee_params.fee;
        const multi = dataItem.multi_transfer_fee;
        if (single && multi) {
          return {
            single: baseAmount(single),
            multi: baseAmount(multi),
          } as TransferFees;
        }
        return null;
      }
      return acc;
    }, null);
  }

  /**
   * Type guard for `TransferFee`
   */
  isTransferFee(v: Fee | TransferFee | DexFees): v is TransferFee {
    return (
      this.isFee((v as TransferFee)?.fixed_fee_params) &&
      !!(v as TransferFee)?.multi_transfer_fee
    );
  }

  /**
   * Type guard for runtime checks of `Fee`
   */
  isFee(v: Fee | TransferFee | DexFees): v is Fee {
    return (
      !!(v as Fee)?.msg_type &&
      (v as Fee)?.fee !== undefined &&
      (v as Fee)?.fee_for !== undefined
    );
  }

  getTx(hash: string) {
    const params = new HttpParams().set('format', 'json');
    return this.http.get(`${this._baseUrl}/tx/${hash}`, { params });
  }

  getPrefix() {
    if (this._asgardexBncClient) {
      return getPrefix(
        this.dcf_networkPath === 'multichain_testnet'
          ? Network.Testnet
          : Network.Mainnet
      );
    } else {
      console.error('this._asgardexBncClient not set');
    }
  }
}
