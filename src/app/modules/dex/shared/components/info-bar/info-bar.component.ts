import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import {
  MidgardPool,
  MarketPool,
  Totals,
} from '@dexShared/interfaces/marketcap';

import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dcf-info-bar',
  templateUrl: './info-bar.component.html',
  styleUrls: ['./info-bar.component.scss'],
})
export class InfoBarComponent implements OnInit {
  public innerWidth!: number;
  public topBar: string = 'top-bar open';
  public expand: string = 'expand open';
  public currencyName: string = 'USD';

  public totalDepth!: number;
  public activePools!: number;
  public activeNodes!: number;
  public avgBond!: number;
  public runePrice!: number;
  public avgGasPrice!: number;
  public txnQueue!: number;
  public blocksToChurn!: number;
  public totalVolume24H!: number;
  public totalVolume7D!: number;
  public totalVolume1M!: number;

  public totalSwap24H!: number;
  public totalSwap7D!: number;
  public totalSwap1M!: number;

  public translation: any;
  public language: string;

  constructor(
    private masterWalletService: MasterWalletManagerService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
    } else if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.topBar = 'top-bar open';
    } else if (this.innerWidth <= 450) {
      this.topBar = 'top-bar open';
    }

    this.masterWalletService.currency$.subscribe((currency) => {
      if (currency !== null) {
        this.currencyName = currency;

        this.masterWalletService.originalPools$.subscribe(
          (pools: MidgardPool[]) => {
            if (pools !== null) {
              this.masterWalletService.originalPriceChange$.subscribe(
                (originalPriceChange) => {
                  if (originalPriceChange !== null) {
                    let marketPools = this.masterWalletService.createPoolList(
                      pools,
                      originalPriceChange,
                      this.currencyName
                    );
                    let activePoolsList = marketPools.filter(
                      (pool) => pool.status == 'available'
                    );
                    this.activePools = activePoolsList.length;

                    let totalDepth = 0;
                    let totalVolume24H = 0;
                    for (let i = 0; i < activePoolsList.length; i++) {
                      totalDepth = totalDepth + activePoolsList[i].depth;
                      totalVolume24H =
                        totalVolume24H + activePoolsList[i].volume;
                    }

                    this.totalDepth = totalDepth / 100000000;
                    this.totalVolume24H = totalVolume24H / 100000000;

                    this.getStats();
                  }
                }
              );
            } else {
              this.getPools();
            }
          }
        );
      }
    });

    this.getTopBarData();

    this.masterWalletService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('info_bar').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  getTopBarData() {
    this.masterWalletService.getQueue().subscribe((queue) => {
      this.txnQueue = queue.outbound;
    });

    this.masterWalletService.getStats().subscribe((stats) => {
      this.runePrice = +stats.runePriceUSD;
    });

    this.masterWalletService.getNetwork().subscribe((network) => {
      this.activeNodes = +network.activeNodeCount;
      this.avgBond = +network.bondMetrics.averageActiveBond / 100000000;

      this.masterWalletService.getHeatlh().subscribe((health) => {
        this.blocksToChurn = +network.nextChurnHeight - +health.scannerHeight;
        this.masterWalletService.setMidgardStatus(health.inSync);
        this.masterWalletService.setThornodeStatus(health.database);
      });
    });
  }

  getPools() {
    this.masterWalletService
      .getPools(this.currencyName)
      .then((poolList: MarketPool[]) => {
        let activePoolsList = poolList.filter(
          (pool) => pool.status === 'available'
        );
        this.activePools = activePoolsList.length;

        let totalDepth = 0;
        let totalVolume24H = 0;
        for (let i = 0; i < activePoolsList.length; i++) {
          totalDepth = totalDepth + activePoolsList[i].depth;
          totalVolume24H = totalVolume24H + activePoolsList[i].volume;
        }

        this.totalDepth = totalDepth / 100000000;
        this.totalVolume24H = totalVolume24H / 100000000;
      });
  }

  getStats() {
    this.masterWalletService.originalDCFTotals$.subscribe((originalTotals) => {
      if (originalTotals !== null) {
        if (this.currencyName === 'RUNE') {
          this.totalVolume24H = originalTotals[0].volume / 100000000;
          this.totalVolume7D = originalTotals[1].volume / 100000000;
          this.totalVolume1M = originalTotals[2].volume / 100000000;
        } else {
          this.totalVolume24H =
            (originalTotals[0]?.volume / 100000000) * this.runePrice;
          this.totalVolume7D =
            (originalTotals[1]?.volume / 100000000) * this.runePrice;
          this.totalVolume1M =
            (originalTotals[2]?.volume / 100000000) * this.runePrice;
        }
      } else {
        let last24hr = this.masterWalletService.getDCFTotals('last24hr');
        let last7days = this.masterWalletService.getDCFTotals('last7day');
        let lastMonth = this.masterWalletService.getDCFTotals('lastMonth');
        forkJoin([last24hr, last7days, lastMonth]).subscribe(
          (result: [Totals, Totals, Totals]) => {
            this.masterWalletService.setOriginalDCFTotals(result);
          }
        );
      }
    });
  }

  setTopBarClass() {
    if (this.topBar === 'top-bar closed') {
      this.topBar = 'top-bar open';
      this.expand = 'expand open';
    } else if (this.topBar === 'top-bar open') {
      this.topBar = 'top-bar closed';
      this.expand = 'expand close';
    }
  }

  getSimbol() {
    if (this.currencyName === 'RUNE') {
      return 'ᚱ';
    } else {
      return '$';
    }
  }
}
