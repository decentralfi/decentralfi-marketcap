import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AssetBalance } from '../interfaces/asset-balance';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { WalletData } from '../interfaces/marketcap';
import { Network, Balance } from '@xchainjs/xchain-client';

@Injectable({
  providedIn: 'root',
})
export class WalletBalanceService {
  asgardexBncClient: binanceClient;

  private walletSource = new BehaviorSubject<string>(null);
  wallet$ = this.walletSource.asObservable();
  private walletData = new BehaviorSubject<WalletData[]>(null);
  walletData$ = this.walletData.asObservable();
  private walletBalancesSource = new BehaviorSubject<AssetBalance[]>(null);
  walletBalances$ = this.walletBalancesSource.asObservable();

  constructor() {
    this.asgardexBncClient = new binanceClient({
      network:
        environment.network === 'testnet' ? Network.Testnet : Network.Mainnet,
    });
  }

  setWalletBalance(balance: AssetBalance[]) {
    this.walletBalancesSource.next(balance);
  }

  setWallet(wallet: string) {
    this.walletSource.next(wallet);
  }

  setWalletData(data: WalletData[]) {
    this.walletData.next(data);
  }

  // async getBalance(address: string) {
  //   try {
  //     const balances = await this.asgardexBncClient.getBalance(address);

  //     const filteredBalance = balances.filter(
  //       (balance: Balance) => !this.isBEP8Token(balance.asset.symbol)
  //     );

  //     const markets = await this.getMarkets();

  //     const coins = filteredBalance.map((coin: Balance) => {
  //       const market = markets.find(
  //         (m: Market) => m.baseAssetSymbol === coin.asset.symbol
  //       );
  //       return {
  //         asset: coin.asset.symbol,
  //         assetValue: tokenAmount(coin.amount.amount()),
  //         price: market ? bnOrZero(market.listPrice) : bn(0),
  //       } as AssetBalance;
  //     });

  //     this.setWalletBalance(coins);
  //   } catch (error) {
  //     console.error('error getting balance: ', error);
  //   }
  // }

  // async getMarkets(): Promise<Market[]> {
  //   const res: MarketResponse = await this.asgardexBncClient..getMarkets({});
  //   if (res.status === 200) {
  //     const markets = res.result.map((dto) => new Market(dto));
  //     return markets;
  //   }
  // }

  private isBEP8Token(symbol: string): boolean {
    if (symbol) {
      const symbolSuffix = symbol.split('-')[1];
      if (
        symbolSuffix &&
        symbolSuffix.length === 4 &&
        symbolSuffix[symbolSuffix.length - 1] === 'M'
      ) {
        return true;
      }
      return false;
    }
    return false;
  }
}
