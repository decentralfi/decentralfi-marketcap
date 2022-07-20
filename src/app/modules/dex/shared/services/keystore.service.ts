import { Injectable } from '@angular/core';

import { decryptFromKeystore } from '@xchainjs/xchain-crypto';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient, ClientUrl } from '@xchainjs/xchain-bitcoin';
import {
  Client as thorchainClient,
  ChainIds,
} from '@xchainjs/xchain-thorchain';
import { Client as ethereumClient } from '@xchainjs/xchain-ethereum';
import { Client as litecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as bitcoinCashClient } from '@xchainjs/xchain-bitcoincash';
import { Client as dogeClient } from '@xchainjs/xchain-doge';
import { Network } from '@xchainjs/xchain-client';

import { environment } from 'src/environments/environment';
import { User } from '../classes/user';

@Injectable({
  providedIn: 'root',
})
export class KeystoreService {
  async unlockKeystore(keystore: any, password: string): Promise<User> {
    const phrase = await decryptFromKeystore(keystore, password);

    const haskoinClientUrl: ClientUrl = {
      mainnet: 'https://api.haskoin.com/btc',
      stagenet: 'https://api.haskoin.com/btc',
      testnet: 'https://api.haskoin.com/btctest',
    };

    const chainIds: ChainIds = {
      mainnet: 'thorchain-mainnet-v1',
      stagenet: 'thorchain-stagenet-v2',
      testnet: 'thorchain-testnet-v2',
    };

    const network =
      environment.network === 'testnet' ? Network.Testnet : Network.Mainnet;

    const userBinanceClient = new binanceClient({ network, phrase });

    const userBtcClient = new bitcoinClient({
      network,
      phrase,
      sochainUrl: 'https://sochain.com/api/v2',
      haskoinUrl: haskoinClientUrl,
    });

    const userThorchainClient = new thorchainClient({
      network,
      phrase,
      chainIds,
    });

    const thorAddress = await userThorchainClient.getAddress();

    const userEthereumClient = new ethereumClient({
      network,
      phrase,
      etherscanApiKey: environment.etherscanKey,
      infuraCreds: { projectId: environment.infuraProjectId },
    });

    const userLtcClient = new litecoinClient({ network, phrase });
    const userbchClient = new bitcoinCashClient({ network, phrase });
    const userdogeClient = new dogeClient({ network, phrase });

    return new User({
      type: 'keystore',
      address: thorAddress,
      keystore,
      clients: {
        binance: userBinanceClient,
        bitcoin: userBtcClient,
        bitcoinCash: userbchClient,
        thorchain: userThorchainClient,
        ethereum: userEthereumClient,
        litecoin: userLtcClient,
        dogecoin: userdogeClient,
      },
    });
  }
}
