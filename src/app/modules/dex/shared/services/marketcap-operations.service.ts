import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Asset } from '@dexShared/classes/asset';
import { WalletData, MarketPool } from '@dexShared/interfaces/marketcap';

@Injectable({
  providedIn: 'root',
})
export class MarketcapOperationsService {
  //SWAP
  private walletSend = new BehaviorSubject<WalletData>(null);
  public walletSend$ = this.walletSend.asObservable();

  private walletRecieve = new BehaviorSubject<WalletData>(null);
  public walletRecieve$ = this.walletRecieve.asObservable();
  private walletRecieveType = new BehaviorSubject<string>(null);
  public walletRecieveType$ = this.walletRecieveType.asObservable();
  private poolIn = new BehaviorSubject<MarketPool>(null);
  public poolIn$ = this.poolIn.asObservable();
  private assetIn = new BehaviorSubject<Asset>(new Asset('BNB.BNB'));
  public assetIn$ = this.assetIn.asObservable();

  private assetOut = new BehaviorSubject<Asset>(new Asset('THOR.RUNE'));
  public assetOut$ = this.assetOut.asObservable();

  constructor() {}

  setWalletSend(walletData: WalletData) {
    this.walletSend.next(walletData);
  }
  setWalletRecieve(walletData: WalletData) {
    this.walletRecieve.next(walletData);
  }
  setWalletRecieveType(type: string) {
    this.walletRecieveType.next(type);
  }
  setpoolIn(pool: MarketPool) {
    this.poolIn.next(pool);
  }
  setAssetIn(asset: Asset) {
    this.assetIn.next(asset);
  }
  setAssetOut(asset: Asset) {
    this.assetOut.next(asset);
  }

  getAssetIn() {
    return this.assetIn.value;
  }
  getAssetOut() {
    return this.assetOut.value;
  }
  getWalletSend() {
    return this.walletSend.value;
  }
  getWalletRecieve() {
    return this.walletRecieve.value;
  }
  getWalletRecieveType() {
    return this.walletRecieveType.value;
  }
}
