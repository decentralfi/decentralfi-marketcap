import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { MatSnackBarRef } from '@angular/material/snack-bar';

import { Subscription, BehaviorSubject, retry, distinct } from 'rxjs';
import { ExplorerPathsService } from '@dexShared/services/explorer-paths.service';
import {
  TransactionStatusService,
  Tx,
  TxStatus, //for testing
  TxActions, //for testing
} from '@dexShared/services/transaction-status.service';

import { Asset } from '@dexShared/classes/asset';
import { Chain } from '@xchainjs/xchain-util'; //for testing
import { WalletData } from '@dexShared/interfaces/marketcap';
import { MasterWalletManagerService } from '@app/services/master-wallet-manager.service';
import { Router } from '@angular/router';
import { MidgardService } from '../../services/midgard.service';
import { consoleLog } from '@app/utils/consoles';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pending',
  templateUrl: './pending.component.html',
  styleUrls: ['./pending.component.scss'],
})
export class PendingComponent implements OnInit, OnDestroy {
  @HostBinding('class') componentCssClass: any;
  snackbarClass: string;
  txs: Tx[] = [];
  // TSX MODIFICATION ARRAY
  del: Tx[] = [];
  oldTxs = new BehaviorSubject([]);

  txsAsset: Asset[];
  subs: Subscription[];
  panelOpenState = false;
  walletData: WalletData[];

  public language: string;
  public translation: any;

  constructor(
    private ref: MatSnackBarRef<PendingComponent>,
    private txStatusService: TransactionStatusService,
    private explorerPathsService: ExplorerPathsService,
    private midgardService: MidgardService,
    private masterWalletManagerService: MasterWalletManagerService,
    private router: Router,
    public translate: TranslateService
  ) {
    /* DUMMY DATA FOR TESTING */
    const bum: Tx[] = [
      {
        action: TxActions.ADD,
        assetAmount: 0.0026502794999999995,
        chain: Chain.THORChain,
        hash: '564312584621321846146513156',
        isThorchainTx: true,
        out_amount: 10.782724914704241,
        out_asset: 'THOR.RUNE',
        status: TxStatus.COMPLETE,
        poolTypeOption: 'SYM',
        symbol: 'BNB',
        ticker: 'RUNE',
      },
      {
        action: TxActions.ADD,
        assetAmount: 0.0026502794999999995,
        chain: Chain.Binance,
        hash: '564312584621321846146513156',
        isThorchainTx: false,
        out_amount: 10.782724914704241,
        out_asset: 'THOR.RUNE',
        poolTypeOption: 'SYM',
        status: TxStatus.COMPLETE,
        symbol: 'BNB',
        ticker: 'BNB',
        out_hash: '1543125846213218461465276446',
        out_chain: Chain.THORChain,
        out_status: TxStatus.COMPLETE,
        out_symbol: 'BNB',
        out_ticker: 'RUNE',
        out_isThorchainTx: true,
      },
    ];

    const pendingTxs$ = this.txStatusService.txs$.subscribe((txs) => {
      consoleLog('init_txs', txs);
      const past_tsx = [];

      this.masterWalletManagerService.walletData$.subscribe((walletData) => {
        if (walletData) {
          // consoleLog({ walletData });
          this.walletData = walletData;

          walletData.forEach(({ address, chain }) => {
            if (chain === 'THOR')
              this.midgardService
                .getTransactions({ address })
                .pipe(retry())
                .subscribe((oldTxs) => {
                  // consoleLog({ chain, oldTxs });

                  oldTxs.actions.forEach((tx) => {
                    // consoleLog({ chain, tx });

                    const isSwap = tx.type === 'swap';
                    const isAdd = tx.type === 'addLiquidity';
                    const isWithdraw = tx.type === 'withdraw';
                    const isRefund = tx.type === 'refund';

                    if (isSwap) {
                      const txData0 = tx.in[0];
                      const txData1 = tx.out[0];

                      const inAsset =
                        this.masterWalletManagerService.getAssetName(
                          txData0.coins[0].asset
                        );
                      const outAsset =
                        this.masterWalletManagerService.getAssetName(
                          txData1.coins[0].asset
                        );

                      const isThor = inAsset.chain === 'THOR';

                      const full = {
                        action: TxActions.SWAP,
                        assetAmount: isThor
                          ? +txData1.coins[0].amount / 10 ** 8
                          : +txData0.coins[0].amount / 10 ** 8,
                        chain: isThor ? outAsset.chain : inAsset.chain,
                        hash: isThor ? txData1.txID : txData0.txID,
                        isThorchainTx: isThor,
                        out_amount: isThor
                          ? +txData0.coins[0].amount / 10 ** 8
                          : +txData1.coins[0].amount / 10 ** 8,
                        out_asset: isThor
                          ? txData0.coins[0].asset
                          : txData1.coins[0].asset,
                        status:
                          tx.status === 'success'
                            ? 'COMPLETE'
                            : tx.type === 'refund'
                            ? 'REFUNDED'
                            : 'PENDING',
                        symbol: isThor ? outAsset.chain : inAsset.chain,
                        ticker: isThor ? outAsset.ticker : inAsset.ticker,
                      };

                      past_tsx.push(full);
                    } else if (isAdd) {
                      const isSYM = tx.in.length === 2;
                      const txData0 = tx.in[0];
                      const txData1 = isSYM && tx.in[1];
                      let full;

                      const firstAsset =
                        this.masterWalletManagerService.getAssetName(
                          txData0.coins[0].asset
                        );
                      const secondAsset =
                        isSYM &&
                        this.masterWalletManagerService.getAssetName(
                          txData1.coins[0].asset
                        );

                      const isThor = firstAsset.chain === 'THOR';

                      if (isSYM) {
                        full = {
                          action: TxActions.ADD,
                          assetAmount: isThor
                            ? +txData1.coins[0].amount / 10 ** 8
                            : +txData0.coins[0].amount / 10 ** 8,
                          chain: isThor ? secondAsset.chain : firstAsset.chain,
                          hash: txData1.txID,
                          isThorchainTx: !isThor,
                          out_amount: +txData0.coins[0].amount / 10 ** 8,
                          out_asset: txData0.coins[0].asset,
                          status:
                            tx.status === 'success'
                              ? 'COMPLETE'
                              : tx.type === 'refund'
                              ? 'REFUNDED'
                              : 'PENDING',
                          poolTypeOption: 'SYM',
                          symbol: isThor ? secondAsset.chain : firstAsset.chain,
                          ticker: isThor
                            ? secondAsset.ticker
                            : firstAsset.ticker,

                          out_hash: isThor ? txData0.txID : txData1.txID,
                          out_chain: isThor
                            ? firstAsset.chain
                            : secondAsset.chain,
                          out_status:
                            tx.status === 'success'
                              ? 'COMPLETE'
                              : tx.type === 'refund'
                              ? 'REFUNDED'
                              : 'PENDING',
                          out_symbol: isThor
                            ? secondAsset.chain
                            : firstAsset.chain,
                          out_ticker: isThor
                            ? firstAsset.ticker
                            : secondAsset.ticker,
                          out_isThorchainTx: isThor,
                        };
                      } else {
                        // consoleLog('NO_SYM');
                        full = {
                          action: TxActions.ADD,
                          assetAmount: +txData0.coins[0].amount / 10 ** 8,
                          chain: firstAsset.chain,
                          hash: txData0.txID,
                          isThorchainTx: isThor,
                          out_amount: +txData0.coins[0].amount / 10 ** 8,
                          out_asset: txData0.coins[0].asset,
                          status:
                            tx.status === 'success'
                              ? 'COMPLETE'
                              : tx.type === 'refund'
                              ? 'REFUNDED'
                              : 'PENDING',
                          poolTypeOption: isThor ? 'ASYM_RUNE' : 'ASYM_ASSET',
                          symbol: firstAsset.chain,
                          ticker: firstAsset.ticker,
                          // out_hash:  false,
                          // out_chain:  false ,
                          // out_status: false,
                          // out_symbol: false,
                          // out_ticker: false,
                          // out_isThorchainTx: false,
                        };
                      }

                      past_tsx.push(full);
                    } else if (isWithdraw) {
                      const isSYM = tx.out.length === 2;
                      const txData0 = tx.out[0];
                      const txData1 = isSYM && tx.out[1];
                      let full;

                      const firstAsset =
                        this.masterWalletManagerService.getAssetName(
                          txData0.coins[0].asset
                        );
                      const secondAsset =
                        isSYM &&
                        this.masterWalletManagerService.getAssetName(
                          txData1.coins[0].asset
                        );

                      const isThor = firstAsset.chain === 'THOR';

                      if (isSYM) {
                        // consoleLog('SYM');
                        full = {
                          action: TxActions.WITHDRAW,
                          assetAmount: isThor
                            ? +txData1.coins[0].amount / 10 ** 8
                            : +txData0.coins[0].amount / 10 ** 8,
                          chain: isThor ? secondAsset.chain : firstAsset.chain,
                          hash: isThor ? txData1.txID : txData0.txID,
                          isThorchainTx: !isThor,
                          out_amount: +txData0.coins[0].amount / 10 ** 8,
                          out_asset: txData0.coins[0].asset,
                          status:
                            tx.status === 'success'
                              ? 'COMPLETE'
                              : tx.type === 'refund'
                              ? 'REFUNDED'
                              : 'PENDING',
                          poolTypeOption: 'SYM',
                          symbol: isThor ? secondAsset.chain : firstAsset.chain,
                          ticker: isThor
                            ? secondAsset.ticker
                            : firstAsset.ticker,

                          out_hash: isThor
                            ? txData0.txID !== '' && txData0.txID
                            : txData1.txID !== '' && txData1.txID,
                          out_chain: isThor
                            ? firstAsset.chain
                            : secondAsset.chain,
                          out_status:
                            tx.status === 'success'
                              ? 'COMPLETE'
                              : tx.type === 'refund'
                              ? 'REFUNDED'
                              : 'PENDING',
                          out_symbol: isThor
                            ? secondAsset.chain
                            : firstAsset.chain,
                          out_ticker: isThor
                            ? firstAsset.ticker
                            : secondAsset.ticker,
                          out_isThorchainTx: isThor,
                        };
                      } else {
                        // consoleLog('NO SYM');
                        full = {
                          action: TxActions.WITHDRAW,
                          assetAmount: +txData0.coins[0].amount / 10 ** 8,
                          chain: firstAsset.chain,
                          hash: txData0.txID,
                          isThorchainTx: !isThor,
                          out_amount: +txData0.coins[0].amount / 10 ** 8,
                          out_asset: txData0.coins[0].asset,
                          status:
                            tx.status === 'success'
                              ? 'COMPLETE'
                              : tx.type === 'refund'
                              ? 'REFUNDED'
                              : 'PENDING',
                          poolTypeOption: isThor ? 'ASYM_RUNE' : 'ASYM_ASSET',
                          symbol: firstAsset.chain,
                          ticker: firstAsset.ticker,

                          // out_hash: false,
                          // out_chain: false ,
                          // out_status: false,
                          // out_symbol: false,
                          // out_ticker: false,
                          // out_isThorchainTx: false,
                        };
                      }

                      past_tsx.push(full);
                    } else if (isRefund) {
                      const txData0 = tx.in[0];
                      const txData1 = tx.out[0];

                      const inAsset =
                        this.masterWalletManagerService.getAssetName(
                          txData0.coins[0].asset
                        );
                      const outAsset =
                        this.masterWalletManagerService.getAssetName(
                          txData1.coins[0].asset
                        );

                      const isThor = txData0.coins[0].asset === 'THOR.RUNE';
                      const isThorAsset = inAsset.chain === 'THOR';

                      const full = {
                        action: TxActions.REFUND,
                        assetAmount: isThor
                          ? +txData1.coins[0].amount / 10 ** 8
                          : +txData0.coins[0].amount / 10 ** 8,
                        chain: isThorAsset ? outAsset.chain : inAsset.chain,
                        hash: isThor ? txData1.txID : txData0.txID,
                        isThorchainTx: isThor,
                        out_amount: isThor
                          ? +txData0.coins[0].amount / 10 ** 8
                          : +txData1.coins[0].amount / 10 ** 8,
                        out_asset: isThor
                          ? txData0.coins[0].asset
                          : txData1.coins[0].asset,
                        status:
                          tx.status === 'success'
                            ? 'COMPLETE'
                            : tx.type === 'refund'
                            ? 'REFUNDED'
                            : 'PENDING',
                        symbol: isThorAsset ? outAsset.chain : inAsset.chain,
                        ticker: isThorAsset ? outAsset.ticker : inAsset.ticker,
                      };

                      past_tsx.push(full);
                    }
                  });
                  this.oldTxs.next(past_tsx);
                });
          });
        }
      });

      // COMBINE DUPLLIACATED ADD SYM
      if (txs.length > 0) {
        const isSymAdd1 =
          txs[0].action === 'Add' && txs[0].poolTypeOption === 'SYM';
        const isSymAdd2 =
          txs[1]?.action === 'Add' && txs[1]?.poolTypeOption === 'SYM';

        consoleLog({ isSymAdd1, isSymAdd2 }, txs[txs.length - 2]?.action);

        if (isSymAdd1 && isSymAdd2) {
          // THIS CODE CLONE THE TSX ARRAY
          const txsClone = Array.from(txs);

          txsClone.reduce((prev, current) => {
            const isAdd = prev.action === 'Add' && current.action === 'Add';
            const isSYM =
              prev.poolTypeOption === 'SYM' && current.poolTypeOption === 'SYM';
            // const sameHash = prev.hash === current.hash;
            consoleLog({ isAdd, isSYM });

            if (isAdd && isSYM) {
              // THIS CREATE AN OBJECT WITH PREVIOUS VALUES
              const fan = {
                ...current,
                status:
                  prev.status === 'COMPLETE' && current.status === 'PENDING'
                    ? TxStatus.IMCOMPLETE
                    : current.status,
                out_hash: prev.hash,
                out_chain: prev.chain,
                out_status: prev.status,
                out_symbol: prev.symbol,
                out_ticker: prev.ticker,
                out_isThorchainTx: prev.isThorchainTx,
              };

              this.del.push(fan);
            }

            return current;
          });

          // IT IS TO REMOVE THE DUPLICATES ADD SYM TSX
          for (let i = 0; i < this.del.length; i++) {
            const assetAmount = this.del[i].assetAmount;
            const out_amount = this.del[i].out_amount;

            const el = txsClone.find(
              (element) =>
                element.assetAmount === assetAmount &&
                element.out_amount === out_amount
            );

            const index = txsClone.indexOf(el);
            txsClone.splice(index, 2);
          }

          const newTxs = [...txsClone, ...this.del];

          consoleLog('NEW TSX:');
          this.txs = newTxs;
        } else if (isSymAdd1) {
          // IF ONLY THERE IS ONE ADD SYM TSX

          // const el = txs[txs.length - 1];
          // const ind = txs.indexOf(el);
          // txs.splice(ind, 1);

          consoleLog('ASYM ADD TXS');
          this.txs = txs;
        } else {
          // IF TSX ARE NOT ADD SYM

          consoleLog('NO CHANGE TXS');
          this.txs = txs;
        }
        // let txsPass;

        this.oldTxs.pipe(distinct()).subscribe((old_tsx) => {
          this.txs = [...this.txs, ...old_tsx];

          // this.txs = txsPass;
        });
      } else {
        this.oldTxs.subscribe((old_tsx) => {
          consoleLog({ justOldTxs: old_tsx });
          this.txs = [...txs, ...old_tsx];
        });
      }
    });

    this.subs = [pendingTxs$];
  }

  ngOnInit(): void {
    this.componentCssClass = 'snackbar-pending';

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('pending').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  explorerPath(chain: Chain, hash: string): string {
    return this.explorerPathsService.getExplorerUrl(chain, hash);
  }

  close() {
    this.ref.dismiss();
  }

  getStatusClass(status: TxStatus) {
    let statusClass = 'tx_status';
    if (status == TxStatus.COMPLETE) {
      statusClass = statusClass + ' completed';
    } else if (status == TxStatus.REFUNDED) {
      statusClass = statusClass + ' refunded';
    } else {
      statusClass = statusClass + ' pending';
    }
    return statusClass;
  }

  getChainImg(chain: string, ticker: string) {
    const asset = new Asset(chain + '.' + ticker);
    return asset.iconPath;
  }

  goToLiquidity(chainOrigin: string) {
    this.walletData.map(({ chain, address }) => {
      if (chain === chainOrigin) {
        this.router.navigate(['/liquidity'], {
          queryParams: { wallet: address },
        });
      }
    });
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
