import { Injectable } from '@angular/core';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient, ClientUrl } from '@xchainjs/xchain-bitcoin';
import {
  Client as thorchainClient,
  getChainIds,
  getDefaultClientUrl,
  ChainIds,
} from '@xchainjs/xchain-thorchain';
import { Client as litecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as bitcoinCashClient } from '@xchainjs/xchain-bitcoincash';
import { Client as ethereumClient } from '@xchainjs/xchain-ethereum';
import { Client as dogeClient } from '@xchainjs/xchain-doge';
import { environment } from 'src/environments/environment';
import { Network } from '@xchainjs/xchain-client';
import { Chain } from '@xchainjs/xchain-util';

const envnetwork = environment.network;
const defaultThorVersion = environment.defaultThorVersion;

/**
 * this is used for convenience methods when user is not using keystore
 */
@Injectable({
  providedIn: 'root',
})
export class MockClientService {
  MOCK_PHRASE =
    'image rally need wedding health address purse army antenna leopard sea gain';

  mockBinanceClient: binanceClient;
  mockBtcClient: bitcoinClient;
  mockThorchainClient: thorchainClient;
  mockEthereumClient: ethereumClient;
  mockLtcClient: litecoinClient;
  mockBchClient: bitcoinCashClient;
  mockDogeClient: dogeClient;

  public dcf_networkPath = defaultThorVersion + '_' + envnetwork;

  constructor() {
    const networkPath = localStorage.getItem('dcf-network');
    const network =
      networkPath === 'multichain_testnet' ? Network.Testnet : Network.Mainnet;
    const phrase = this.MOCK_PHRASE;

    this.initThorchainClient(network, phrase);
    this.initBinanceClient(network, phrase);
    this.initBitcoinClient(network, phrase);
    this.initBitcoincashClient(network, phrase);
    this.initDogecoinClient(network, phrase);
    this.initEthereumClient(network, phrase);
    this.initLitecoinClient(network, phrase);
  }

  private async initThorchainClient(network: Network, phrase: string) {
    const chainIds = await this.setChainIds();
    this.mockThorchainClient = new thorchainClient({
      network,
      phrase,
      chainIds,
    });
  }

  private async setChainIds(): Promise<ChainIds> {
    const chainIds = await getChainIds(getDefaultClientUrl());
    return chainIds;
  }

  private async initBinanceClient(network: Network, phrase: string) {
    this.mockBinanceClient = new binanceClient({
      network: network,
      phrase: phrase,
    });
  }

  private async initBitcoinClient(network: Network, phrase: string) {
    const haskoinClientUrl: ClientUrl = {
      mainnet: 'https://haskoin.ninerealms.com/btc',
      stagenet: 'https://haskoin.ninerealms.com/btc',
      testnet: 'https://haskoin.ninerealms.com/btctest',
    };
    this.mockBtcClient = new bitcoinClient({
      network,
      phrase,
      sochainUrl: 'https://sochain.com/api/v2',
      haskoinUrl: haskoinClientUrl,
    });
  }

  private async initBitcoincashClient(network: Network, phrase: string) {
    this.mockBchClient = new bitcoinCashClient({ network, phrase });
  }

  private async initDogecoinClient(network: Network, phrase: string) {
    this.mockDogeClient = new dogeClient({ network, phrase });
  }

  private async initLitecoinClient(network: Network, phrase: string) {
    this.mockLtcClient = new litecoinClient({ network, phrase });
  }

  private async initEthereumClient(network: Network, phrase: string) {
    this.mockEthereumClient = new ethereumClient({
      network,
      phrase,
      etherscanApiKey: environment.etherscanKey,
      infuraCreds: { projectId: environment.infuraProjectId as string },
    });
  }

  getMockClientByChain(chain: Chain) {
    switch (chain) {
      case 'BTC':
        return this.mockBtcClient;

      case 'ETH':
        return this.mockEthereumClient;

      case 'BNB':
        return this.mockBinanceClient;

      case 'BCH':
        return this.mockBchClient;

      case 'LTC':
        return this.mockLtcClient;

      case 'THOR':
        return this.mockThorchainClient;

      case 'DOGE':
        return this.mockDogeClient;
    }

    throw new Error(`mock client no matching client for chain: ${chain}`);
  }
}
