import { Client as BinanceClient } from '@xchainjs/xchain-binance';
import { Client as BitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as ThorchainClient } from '@xchainjs/xchain-thorchain';
import { Client as EthereumClient } from '@xchainjs/xchain-ethereum';
import { Client as LitecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as BitcoinCashClient } from '@xchainjs/xchain-bitcoincash';
import { Client as dogeClient } from '@xchainjs/xchain-doge';
import { Balance } from '@xchainjs/xchain-client';

export type WalletType =
  | 'keystore'
  | 'walletconnect'
  | 'ledger'
  | 'xdefi'
  | 'metamask'
  | 'manual';

export type ClientType =
  | 'bitcoin'
  | 'binance'
  | 'bitcoinCash'
  | 'thorchain'
  | 'ethereum'
  | 'litecoin'
  | 'dogecoin';

export interface AvailableClients {
  binance: BinanceClient;
  bitcoin?: BitcoinClient;
  bitcoinCash?: BitcoinCashClient;
  thorchain: ThorchainClient;
  ethereum: EthereumClient;
  litecoin?: LitecoinClient;
  dogecoin?: dogeClient;
}

export class User {
  type: WalletType;
  address: string; // Address
  keystore?: any;
  clients?: AvailableClients;

  // for Ledger
  ledger?: any;
  hdPath?: number[];
  balances: Balance[];

  constructor(user: {
    type: WalletType;
    address: string;
    keystore?: any;
    ledger?: any;
    hdPath?: number[];
    clients?: AvailableClients;
  }) {
    this.type = user.type;
    this.address = user.address;
    this.keystore = user.keystore ?? null;
    this.ledger = user.ledger ?? null;
    this.hdPath = user.hdPath ?? null;
    this.clients = user.clients;
  }
}
