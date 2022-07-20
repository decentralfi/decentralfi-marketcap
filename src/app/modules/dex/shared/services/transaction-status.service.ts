import { Injectable } from '@angular/core';
// import Transaction from '@binance-chain/javascript-sdk/lib/tx';
import { HttpClient } from '@angular/common/http';

import { TransactionDTO } from '../classes/transaction';
import { BinanceService } from './binance.service';

import { MidgardService, ThornodeTx } from './midgard.service';
import { Chain } from '@xchainjs/xchain-util';

import { SochainService, SochainTxResponse } from './sochain.service';
import { HaskoinService, HaskoinTxResponse } from './haskoin.service';
import { RpcTxSearchRes, ThorchainRpcService } from './thorchain-rpc.service';

import { BehaviorSubject, of, Subject, timer, Subscription } from 'rxjs';
import {
  catchError,
  switchMap,
  takeUntil,
  retryWhen,
  delay,
  take,
  retry,
} from 'rxjs/operators';

import {
  // WalletType,
  AvailableClients,
} from '@dexShared/classes/user';
import { environment } from 'src/environments/environment';
import { UserService } from './user.service';
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';
import { PoolTypeOption } from '@dexShared/constants/pool-type-options';
import * as moment from 'moment';
import { consoleLog } from '@app/utils/consoles';

export const enum TxStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  REFUNDED = 'REFUNDED',
  IMCOMPLETE = 'INCOMPLETE',
}

export type tyTxStatus = 'PENDING' | 'COMPLETE' | 'REFUNDED' | 'INCOMPLETE';

export enum TxActions {
  SEND = 'Send',
  SWAP = 'Swap',
  ADD = 'Add',
  WITHDRAW = 'Withdraw',
  REFUND = 'Refund',
}

export type tyTxActions = 'Swap' | 'Add' | 'Withdraw' | 'Refund';

export interface Tx {
  id?: number;
  chain: Chain;
  ticker: string;
  symbol: string;
  hash: string;
  status: TxStatus;
  action: TxActions;
  isThorchainTx: boolean;
  assetAmount: number;

  out_asset: string;
  out_amount: number;
  out_chain?: Chain;
  out_isThorchainTx?: boolean;
  out_symbol?: string;
  out_ticker?: string;
  out_status?: TxStatus;
  out_hash?: string;
  poolTypeOption?: PoolTypeOption;

  /**
   * This is a temporary patch because midgard is not picking up withdraw of pending assets
   */
  pollThornodeDirectly?: boolean;

  /**
   * This is for THOR.RUNE transfers, which are not picked up by midgard or thornode tx endpoints
   */
  pollRpc?: boolean;

  time?: string;
}
export interface DCFTx {
  applies_slippage_protection: boolean;
  id: number;
  id_transaction: number;
  in_amount: string;
  in_asset: string;
  in_tx_id: string;
  out_amount: string;
  out_asset: string;
  out_tx_id: string;
  status: string;
  time: string;
  type: string;
  user_slippage_protection: boolean;
}

const dfc_api = environment.endpoint;
const network = environment.network;
const defaultThorVersion = environment.defaultThorVersion;

@Injectable({
  providedIn: 'root',
})
export class TransactionStatusService {
  private _txs: Tx[];
  private transactionSource = new BehaviorSubject<Tx[]>([]);
  txs$ = this.transactionSource.asObservable();

  killOutputsPolling: { [key: string]: Subject<void> } = {};

  killTxPolling: { [key: string]: Subject<void> } = {};

  clients: AvailableClients;

  public dcf_networkPath = defaultThorVersion + '_' + network;
  private endpointUrl = environment.midgard_endpoint;

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    private rpcService: ThorchainRpcService,
    private sochainService: SochainService,
    private haskoinService: HaskoinService,
    private binanceService: BinanceService,
    private masterWalletBalanceService: MasterWalletManagerService,
    private http: HttpClient
  ) {
    this._txs = [];

    //if (network == 'testnet') {
    /*let networkPath = localStorage.getItem('dcf-network');
      if (networkPath == null) {
        localStorage.setItem('dcf-network', this.dcf_networkPath);
      } else {
        this.dcf_networkPath = networkPath;
      }*/

    if (this.dcf_networkPath == 'multichain_testnet') {
      this.endpointUrl = 'https://testnet.midgard.thorchain.info/v2/';
    } else {
      this.endpointUrl = 'https://midgard.thorchain.info/v2/';
    }
    //}
  }

  saveDCFTx(pendingTx: Tx) {
    let status = pendingTx.status as string;
    let time = moment().format('MM/DD/YYYY HH:[00]');
    let tx = {
      type: pendingTx.action,
      status: status.toLocaleLowerCase(),
      in_tx_id: pendingTx.hash,
      in_asset: pendingTx.chain + '.' + pendingTx.ticker,
      in_amount: pendingTx.assetAmount,
      out_tx_id: pendingTx.hash,
      out_asset: pendingTx.out_asset,
      out_amount: pendingTx.out_amount,
      time: time,
    };

    const poolsCall = this.http
      .post<DCFTx>(dfc_api + 'history_transaction/', tx)
      .subscribe((dcfTx) => {
        consoleLog(dcfTx);
        let txSource = this.transactionSource.value;
        for (let i = 0; i < txSource.length; i++) {
          if (txSource[i].hash == dcfTx.in_tx_id) {
            txSource[i].id = dcfTx.id;
          }
        }
        this.transactionSource.next(txSource);
        let sub: Subscription = poolsCall;
        sub.unsubscribe();
      });
  }

  updateDCFTx(pendingTx: Tx) {
    let status = pendingTx.status as string;
    let tx = {
      status: status.toLocaleLowerCase(),
    };

    const poolsCall = this.http
      .put(dfc_api + 'history_transaction/' + pendingTx.id + '/', tx)
      .subscribe((data) => {
        consoleLog(data);
        let sub: Subscription = poolsCall;
        sub.unsubscribe();
      });
  }

  // this needs to be simplified and cleaned up
  // only check against thorchain to see if tx is successful
  // add inputs and outputs to Tx
  addTransaction(pendingTx: Tx) {
    consoleLog({ pendingTx });
    // consoleLog({ pendingTx });
    // remove 0x
    if (pendingTx.chain === 'ETH') {
      pendingTx.hash = pendingTx.hash.substr(2);
    }

    this._txs.unshift(pendingTx);

    if (pendingTx.status === TxStatus.PENDING) {
      this.killTxPolling[pendingTx.hash] = new Subject();

      if (pendingTx.isThorchainTx || pendingTx.chain === 'THOR') {
        if (pendingTx.pollRpc) {
          /**
           * THOR.RUNE transfers to different wallet
           */
          this.pollRpc(pendingTx.hash);
        } else if (pendingTx.pollThornodeDirectly) {
          /**
           * This is a temporary patch because midgard is not picking up withdraw of pending assets
           */
          this.pollThornodeTx(pendingTx.hash);
        } else {
          /**
           * Poll Midgard
           */

          this.pollThorchainTx(pendingTx.hash);
        }
      } else {
        if (pendingTx.chain === 'BNB') {
          this.pollBnbTx(pendingTx);
        } else if (pendingTx.chain === 'ETH') {
          this.pollEthTx(pendingTx);
        } else if (pendingTx.chain === 'BTC' || pendingTx.chain === 'LTC') {
          this.pollSochainTx(pendingTx);
        } else if (pendingTx.chain === 'BCH') {
          this.pollBchTx(pendingTx);
        }
      }

      this.saveDCFTx(pendingTx);
    }

    this.transactionSource.next(this._txs);
  }

  updateTxStatus(hash: string, status: TxStatus) {
    const updatedTxs = this._txs.reduce((txs, tx) => {
      if (tx.hash === hash) {
        tx.status = status;
        this.masterWalletBalanceService.updateWalletDataBalances();
      }

      txs.push(tx);

      return txs;
    }, []);

    this._txs = updatedTxs;

    consoleLog({ _tsx: this._txs, hash, status });

    if (status !== TxStatus.PENDING) {
      let tx = this.transactionSource.value.filter((tx) => tx.hash === hash);
      if (tx.length > 0) {
        this.updateDCFTx(tx[0]);
      }
    }
    this.transactionSource.next(this._txs);
  }

  pollThorchainTx(hash: string) {
    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.midgardService.getTransaction(hash)),
        // retry in case CORS error or something fails
        retry()
      )
      .subscribe(async (res: TransactionDTO) => {
        consoleLog({ res });
        if (+res.count > 0) {
          for (const resTx of res.actions) {
            if (
              resTx.in[0].txID.toUpperCase() === hash.toUpperCase() &&
              resTx.status.toUpperCase() === 'SUCCESS'
            ) {
              if (resTx.type.toUpperCase() === 'REFUND') {
                this.updateTxStatus(hash, TxStatus.REFUNDED);
              } else {
                this.updateTxStatus(hash, TxStatus.COMPLETE);
              }

              // this.userService.fetchBalances();
              this.killTxPolling[hash].next();
            } else if (
              resTx.in[0].txID.toUpperCase() === hash.toUpperCase() &&
              resTx.status.toUpperCase() === 'PENDING' &&
              resTx.type.toUpperCase() === 'REFUND'
            ) {
              consoleLog(
                'PENDING_REFUND:',
                resTx.status.toUpperCase(),
                resTx.type.toUpperCase()
              );
              this.updateTxStatus(hash, TxStatus.REFUNDED);
            } else {
              consoleLog('NO IQUAL HASH OR STATUS NOT SUCESS');
            }
          }
        }
      });
  }

  /**
   * This is being used as a temporary patch
   * Midgard is not picking up WITHDRAW on pending_assets
   */
  pollThornodeTx(hash: string) {
    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.midgardService.getThornodeTransaction(hash)),
        // catchError handles http throws
        catchError((error) => of(error))
      )
      .subscribe(async (res: ThornodeTx) => {
        if (
          res &&
          res.observed_tx &&
          res.observed_tx.status &&
          res.observed_tx.status.toUpperCase() === 'DONE'
        ) {
          this.updateTxStatus(hash, TxStatus.COMPLETE);
          // this.userService.fetchBalances();
          this.killTxPolling[hash].next();
        } else {
          consoleLog('still pending...');
        }
      });
  }

  /**
   * Temporary patch until it's easier to track THOR.RUNE wallet transfers
   */
  pollRpc(hash: string) {
    if (!this.clients) {
      return;
    }

    const thorAddress = this.clients.thorchain.getAddress();
    if (!thorAddress) {
      return;
    }

    timer(5000, 45000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.rpcService.txSearch(thorAddress)),
        retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(async (res: RpcTxSearchRes) => {
        if (res && res.result && res.result.txs && res.result.txs.length > 0) {
          const match = res.result.txs.find((tx) => tx.hash === hash);
          if (match) {
            this.updateTxStatus(hash, TxStatus.COMPLETE);
            // this.userService.fetchBalances();
            this.killTxPolling[hash].next();
          }
        } else {
          consoleLog('continue polling rpc: ', res);
        }
      });
  }

  pollBchTx(tx: Tx) {
    timer(5000, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[tx.hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.haskoinService.getTx(tx.hash)),
        retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(async (res: HaskoinTxResponse) => {
        if (res && res.block && res.block.height && res.block.height > 0) {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          // this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();
        } else {
          consoleLog('continue polling bch...', res);
        }
      });
  }

  pollSochainTx(tx: Tx) {
    const network = environment.network === 'testnet' ? 'testnet' : 'mainnet';

    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[tx.hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() =>
          this.sochainService.getTransaction({
            txID: tx.hash,
            network,
            chain: tx.chain,
          })
        ),
        // sochain returns 404 when not found
        // this allows timer to continue polling
        retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(async (res: SochainTxResponse) => {
        if (
          res.status === 'success' &&
          res.data &&
          res.data.confirmations &&
          res.data.confirmations > 0
        ) {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          //this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();
        }
      });
  }

  pollBnbTx(tx: Tx) {
    timer(5000, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[tx.hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        // switchMap(() => this.midgardService.getTransaction(tx.hash)),
        switchMap(() => this.binanceService.getTx(tx.hash)),
        // catchError handles http throws
        catchError((error) => of(error))
      )
      .subscribe(async (res) => {
        if (+res.code === 0) {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          // this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();
        }
      });
  }

  pollEthTx(tx: Tx) {
    if (this.clients && this.clients.ethereum) {
      const ethClient = this.clients.ethereum;
      const provider = ethClient.getProvider();

      timer(5000, 15000)
        .pipe(
          // This kills the request if the user closes the component
          takeUntil(this.killTxPolling[tx.hash]),
          // switchMap cancels the last request, if no response have been received since last tick
          switchMap(() => provider.getTransaction(`0x${tx.hash}`)),
          // catchError handles http throws
          catchError((error) => of(error))
        )
        .subscribe(async (res) => {
          if (res.confirmations && res.confirmations > 0) {
            this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
            // this.userService.fetchBalances();
            this.killTxPolling[tx.hash].next();
          }
        });
    } else {
      // console.error('no eth client found...', this.user);
      console.error('no eth client found...');
    }
  }

  chainBlockReward(chain: Chain): number {
    switch (chain) {
      case 'BTC':
        return 6.5;

      case 'BCH':
        return 6.25;

      case 'LTC':
        return 12.5;

      case 'ETH':
        return 3;

      // Confirms immediately
      // case 'BNB':
      //   return ~;
    }
  }

  chainBlockTime(chain: Chain): number {
    // in seconds
    switch (chain) {
      case 'BTC':
        return 600;

      case 'BCH':
        return 600;

      case 'LTC':
        return 150;

      case 'ETH':
        return 15;

      // Confirms immediately
      // case 'BNB':
      //   return ~;
    }
  }

  estimateTime(chain: Chain, amount: number): number {
    if (chain === 'BNB' || chain === 'THOR') {
      return 1;
    } else {
      const chainBlockReward = this.chainBlockReward(chain);
      const chainBlockTime = this.chainBlockTime(chain);
      const estimatedMinutes =
        Math.ceil(amount / chainBlockReward) * (chainBlockTime / 60);
      return estimatedMinutes < 1 ? 1 : estimatedMinutes;
    }
  }

  getPendingTxCount() {
    return this._txs.reduce((count, tx) => {
      if (tx.status === TxStatus.PENDING) {
        count++;
      }

      return count;
    }, 0);
  }
}
