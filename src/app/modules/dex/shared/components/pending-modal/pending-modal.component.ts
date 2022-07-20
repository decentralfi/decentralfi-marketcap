import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

// import { environment } from 'src/environments/environment';

import { BehaviorSubject, Subscription } from 'rxjs';
import { ExplorerPathsService } from '@dexShared/services/explorer-paths.service';
import {
  TransactionStatusService,
  Tx,
  TxStatus,
  TxActions,
} from '@dexShared/services/transaction-status.service';
import { Chain } from '@xchainjs/xchain-util'; // for testing
import { Asset } from '@dexShared/classes/asset';
import { MidgardService } from '@dexShared/services/midgard.service';
import { MasterWalletManagerService } from '@app/services/master-wallet-manager.service';

import { WalletData } from '@dexShared/interfaces/marketcap';
import { MatPaginator } from '@angular/material/paginator';
import { consoleLog } from '@app/utils/consoles';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pending-modal',
  templateUrl: './pending-modal.component.html',
  styleUrls: ['./pending-modal.component.scss'],
})
export class PendingModalComponent implements OnInit, OnDestroy {
  public txs: Tx[];
  public del: Tx[] = [];
  public oldTxs = new BehaviorSubject([]);

  public sortTxs = [];

  public bitcoinExplorerUrl: string;
  public bchExplorerUrl: string;
  public binanceExplorerUrl: string;
  public thorchainExplorerUrl: string;
  public ethereumExplorerUrl: string;
  public litecoinExplorerUrl: string;
  public subs: Subscription[];
  public walletData: WalletData[];
  public pageSize = 5;

  public language: string;
  public translation: any;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  // @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private txStatusService: TransactionStatusService,
    private explorerPathsService: ExplorerPathsService,
    private midgardService: MidgardService,
    private masterWalletManagerService: MasterWalletManagerService,
    private router: Router,
    public translate: TranslateService
  ) {
    const bum = [
      {
        chain: Chain.Bitcoin,
        ticker: 'BTC',
        symbol: 'BTC',
        hash: '564312584621321846146513156',
        status: TxStatus.PENDING,
        action: TxActions.ADD,
        isThorchainTx: true,
        assetAmount: 0.225,
        out_asset: 'BTC',
        out_amount: 0.254,
      },
      {
        chain: Chain.Binance,
        ticker: 'BTC',
        symbol: 'BTC',
        hash: '564312584621321846146513156',
        status: TxStatus.COMPLETE,
        action: TxActions.ADD,
        isThorchainTx: true,
        assetAmount: 0.225,
        out_asset: 'BTC',
        out_amount: 0.254,
      },
      {
        chain: Chain.Binance,
        ticker: 'BTC',
        symbol: 'BTC',
        hash: '564312584621321846146513156',
        status: TxStatus.PENDING,
        action: TxActions.ADD,
        isThorchainTx: true,
        assetAmount: 0.225,
        out_asset: 'BTC',
        out_amount: 0.254,
      },
      {
        chain: Chain.THORChain,
        ticker: 'RUNE',
        symbol: 'RUNE',
        hash: '564312584621321846146513156',
        status: TxStatus.PENDING,
        action: TxActions.ADD,
        isThorchainTx: true,
        assetAmount: 0.225,
        out_asset: 'BTC',
        out_amount: 0.254,
      },
    ];

    this.txs = [];

    const pendingTxs$ = this.txStatusService.txs$.subscribe((txs) => {
      consoleLog('txs', txs);
      let old_tsx = [];

      this.masterWalletManagerService.walletData$.subscribe((walletData) => {
        if (walletData) {
          consoleLog({ walletData });
          this.walletData = walletData;

          walletData.forEach(({ address, chain }) => {
            if (chain === 'THOR')
              this.midgardService
                .getTransactions({ address, limit: '50' })
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
                      // consoleLog('isSwap', full);
                      old_tsx.push(full);
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
                        consoleLog('NO_SYM');
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

                      // consoleLog('isAdd', full);
                      old_tsx.push(full);
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
                        consoleLog('SYM');
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
                        consoleLog('NO SYM');
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

                      // consoleLog('isWithdraw', full);
                      old_tsx.push(full);
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

                      // consoleLog('isRefund', full);
                      old_tsx.push(full);
                    }
                  });
                  this.oldTxs.next(old_tsx);
                });
          });
        }
      });

      if (txs.length > 0) {
        const is1 =
          txs[txs.length - 1].action === 'Add' &&
          txs[txs.length - 1].poolTypeOption === 'SYM';
        const is2 =
          txs[txs.length - 2]?.action === 'Add' &&
          txs[txs.length - 2]?.poolTypeOption === 'SYM';

        consoleLog({ is1, is2 }, txs[txs.length - 2]?.action);

        if (is1 && is2) {
          // THIS CLONE THE TSX ARRAY
          let txsClone = Array.from(txs);

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

          consoleLog('NEW TSX:', [...newTxs, ...old_tsx]);

          this.oldTxs.subscribe((old_tsx) => {
            this.txs = [...newTxs, ...old_tsx];
            this.sortTxs = this.txs;
          });

          // this.txs = newTxs;
        } else if (is1) {
          // IF ONLY THERE IS ONE ADD SYM TSX

          // const el = txs[txs.length - 1];
          // const ind = txs.indexOf(el);
          // txs.splice(ind, 1);
          consoleLog('EQUAL TXS', [...txs, ...old_tsx]);
          this.oldTxs.subscribe((old_tsx) => {
            this.txs = [...txs, ...old_tsx];
            this.sortTxs = this.txs;
          });
          // this.txs = txs;
        } else {
          // IF TSX ARE NOT ADD SYM

          consoleLog('NO CHANGE TXS', [...txs, ...old_tsx]);
          this.oldTxs.subscribe((old_tsx) => {
            this.txs = [...txs, ...old_tsx];
            this.sortTxs = this.txs;
          });
          // this.txs = txs;
        }
      } else {
        this.oldTxs.subscribe((old_tsx) => {
          consoleLog({ old_tsx });

          this.txs = [...txs, ...old_tsx];
          this.sortTxs = this.txs;
          this.onPageChange({ pageIndex: 0, pageSize: this.pageSize });
          // this.setPaginatorPageSize(this.pageSize);
        });
      }
    });

    this.subs = [pendingTxs$];
  }

  ngOnInit(): void {
    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('pending').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  explorerPath(tx: Tx): string {
    return this.explorerPathsService.getExplorerUrl(tx.chain, tx.hash);
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
    let asset = new Asset(chain + '.' + ticker);
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

  setPaginatorPageSize(size: number) {
    this.pageSize = size;
    this.paginator.pageSize = size;
    this.paginator._changePageSize(size);
  }

  getPaginatorClass(size) {
    if (size === this.pageSize) {
      return 'page-size-selected';
    } else {
      return 'page-size';
    }
  }

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    const { pageIndex, pageSize } = event;
    const bum = this.txs.slice(
      pageIndex * pageSize,
      pageIndex * pageSize + pageSize
    );

    this.sortTxs = bum;

    consoleLog(
      // { event },
      // pageIndex * pageSize,
      // pageIndex * pageSize + pageSize,
      bum,
      this.sortTxs
    );
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
