import {
  Component,
  OnInit,
  HostBinding,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

import { environment } from 'src/environments/environment';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';

// INTERFACES
import { MarketcapOperationsComponent } from '@dexShared/dialogs/marketcap-operations/marketcap-operations.component';
import { MidgardPool, MarketPool } from '@dexShared/interfaces/marketcap';

/* Master Wallet Manager */
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-marketcap',
  templateUrl: './marketcap.component.html',
  styleUrls: ['./marketcap.component.scss'],
})
export class MarketcapComponent implements OnInit {
  public innerWidth: any;

  @HostBinding('class') componentCssClass: any;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.topBar = 'top-bar open';
    } else if (this.innerWidth <= 450) {
      this.topBar = 'top-bar open';
    }
  }

  public showHideToggle = true;

  public poolList: MarketPool[] = [];

  public displayedColumns: string[] = [
    'rank',
    'name',
    'chain',
    'price',
    'depth',
    'apy',
    'volume',
    'perc',
    'weeklyChange',
    'graph',
    'status',
    'operation',
  ];
  public dataSource = new MatTableDataSource<MarketPool>(this.poolList);

  public themeValue = '';
  public columDark: boolean;
  public currencyValue = 'USD';
  public currencyName = 'USD';
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;

  public binanceExplorerUrl: string;
  public poolRatesTablePageSize = 100;
  public isLoading = true;
  public sortedData: MarketPool[];

  public totalDepth: number;
  public activePools: number;
  public activeNodes: number;
  public avgBond: number;
  public runePrice: number;
  public avgGasPrice: number;
  public txnQueue: number;
  public blocksToChurn: number;
  public totalVolume24H: number;
  public totalVolume7D: number;
  public totalVolume1M: number;

  public totalSwap24H: number;
  public totalSwap7D: number;
  public totalSwap1M: number;

  public resume: number;

  public topBar = 'top-bar open';
  public loaderFile = '../../../../assets/images/loader/decentralfi-light.svg';
  public liquidityAddress: string;
  public liquidityAddressMsg: string;

  public translation: any;
  public language: string;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private router: Router,
    private masterWalletManagerService: MasterWalletManagerService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    //private mockClientService: MockClientService
    public translate: TranslateService
  ) {
    this.binanceExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org/'
        : 'https://explorer.binance.org/';

    this.componentCssClass = 'full';

    this.sortedData = this.poolList.slice();
  }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.topBar = 'top-bar open';
    } else if (this.innerWidth <= 450) {
      this.topBar = 'top-bar open';
    }

    this.masterWalletManagerService.currency$.subscribe((currency) => {
      if (currency !== null) {
        this.currencyName = currency;
        this.masterWalletManagerService.originalPools$.subscribe(
          (pools: MidgardPool[]) => {
            if (pools !== null) {
              this.masterWalletManagerService.originalPriceChange$.subscribe(
                (depthPriceHistory) => {
                  if (depthPriceHistory !== null) {
                    const marketPools =
                      this.masterWalletManagerService.createPoolList(
                        pools,
                        depthPriceHistory,
                        this.currencyName
                      );
                    this.poolList = marketPools;
                    this.processPoolstable(marketPools);
                  }
                }
              );
            }
          }
        );

        this.masterWalletManagerService.originalDCFTotals$.subscribe(
          (totals) => {
            if (totals !== null) {
              if (this.currencyName == 'USD') {
                this.masterWalletManagerService.originalStats$.subscribe(
                  (stats) => {
                    if (stats != null) {
                      this.runePrice = +stats.runePriceUSD;
                      this.totalVolume24H =
                        (totals[0].volume / 100000000) * this.runePrice;
                      this.totalVolume1M =
                        (totals[2].volume / 100000000) * this.runePrice;
                    }
                  }
                );
              } else {
                this.totalVolume24H = totals[0].volume / 100000000;
                this.totalVolume1M = totals[2].volume / 100000000;
              }
              this.totalSwap24H = totals[0].swaps;
              this.totalSwap1M = totals[1].swaps;
            }
          }
        );
      }
    });

    this.masterWalletManagerService.walletResume$.subscribe((resume) => {
      if (resume !== null) {
        this.resume = resume;
      } else {
        setTimeout(() => {
          this.masterWalletManagerService.createResume(this.currencyName);
        }, 5000);
      }
    });

    this.masterWalletManagerService.globalShowHide$.subscribe((value) => {
      if (value != null) {
        this.showHideToggle = value;
      }
    });

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      this.themeValue = theme;

      if (this.themeValue === null || this.themeValue === 'light-theme') {
        this.loaderFile =
          '../../../../assets/images/loader/decentralfi-light.svg';
      } else {
        this.loaderFile =
          '../../../../assets/images/loader/decentralfi-dark.svg';
      }
    });

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('marketcap').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  processPoolstable(poolList: MarketPool[]) {
    this.dataSource = new MatTableDataSource(poolList);
    this.dataSource.paginator = this.paginator;
  }

  setPaginatorPageSize(size: number) {
    this.poolRatesTablePageSize = size;
    this.paginator.pageSize = size;
    this.dataSource.paginator = this.paginator;
  }

  getPaginatorClass(size: any) {
    if (size == this.poolRatesTablePageSize) {
      return 'page-size-selected';
    } else {
      return 'page-size';
    }
  }

  getStatusClass(status: string): string {
    let statusClass = '';
    status == 'available'
      ? (statusClass = 'status-dot green')
      : (statusClass = 'status-dot yellow');
    return statusClass;
  }

  getPercClass(perc: number): string {
    let statusClass = '';
    perc > 0 ? (statusClass = 'perc-green') : (statusClass = 'perc-red');
    if (perc == 0) {
      statusClass = 'perc-yellow';
    }
    return statusClass;
  }

  getSimbol(title?: boolean) {
    if (this.currencyName == 'RUNE') {
      return 'ᚱ';
    } else if (this.currencyName == 'USD') {
      return '$';
    } else {
      if (title) {
        return '$';
      } else {
        return '';
      }
    }
  }

  sortData(sort: Sort) {
    const data = this.poolList.slice();
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      this.dataSource = new MatTableDataSource(this.sortedData);
      this.dataSource.paginator = this.paginator;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'rank':
          return compare(a.rank, b.rank, isAsc);
        case 'name':
          return compare(a.name, b.name, isAsc);
        case 'asset':
          return compare(a.asset.symbol, b.asset.symbol, isAsc);
        case 'apy':
          return compare(a.apy, b.apy, isAsc);
        case 'chain':
          return compare(a.chain, b.chain, isAsc);
        case 'price':
          return compare(a.price, b.price, isAsc);
        case 'depth':
          return compare(a.depth, b.depth, isAsc);
        case 'volume':
          return compare(a.volume, b.volume, isAsc);
        case 'perc':
          return compare(a.perc, b.perc, isAsc);
        case 'status':
          return compare(a.status, b.status, isAsc);
        default:
          return 0;
      }
    });

    this.dataSource = new MatTableDataSource(this.sortedData);
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    const chains = {
      ethereum: 'ethereum',
      binance: 'binance',
      bitcoin: 'bitcoin',
      litecoin: 'litecoin',
      bitcoin_cash: 'bitcoincash',
    };

    this.dataSource.filterPredicate = function (data, filter: string): boolean {
      const empty = filter === '';

      if (chains.ethereum.includes(filter.toLowerCase()) && !empty) {
        return data.asset.chain === 'ETH';
      }
      if (chains.binance.includes(filter.toLowerCase()) && !empty) {
        return data.asset.chain === 'BNB';
      }
      if (chains.bitcoin.includes(filter.toLowerCase()) && !empty) {
        return data.asset.chain === 'BTC' || data.asset.chain === 'BCH';
      }
      if (chains.bitcoin_cash.includes(filter.toLowerCase()) && !empty) {
        return data.asset.chain === 'BCH';
      }
      if (chains.litecoin.includes(filter.toLowerCase()) && !empty) {
        return data.asset.chain === 'LTC';
      }

      return (
        data.asset.ticker.toLowerCase().includes(filter) ||
        data.asset.chain.toLowerCase().includes(filter) ||
        data.asset.fullname.toLowerCase().includes(filter)
      );
    };

    const newfilteredData = [];

    for (let i = 0; i < this.poolList.length; i++) {
      const predicate = this.dataSource.filterPredicate(
        this.poolList[i],
        filterValue
      );
      if (predicate === true) {
        newfilteredData.push(this.poolList[i]);
      }
    }

    this.dataSource = new MatTableDataSource(newfilteredData);
    this.dataSource.paginator = this.paginator;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  tdColorOne() {
    if (localStorage.getItem('dcf-theme') === 'light-theme') {
      return 'td-stiky-ligth1';
    } else {
      return 'td-stiky-dark1';
    }
  }

  tdColorTwo() {
    if (localStorage.getItem('dcf-theme') === 'light-theme') {
      return 'td-stiky-ligth2';
    } else {
      return 'td-stiky-dark2';
    }
  }

  goTo(link: string) {
    window.open(link, '_blank');
  }
  gotToLiquidity() {
    if (this.liquidityAddress && this.liquidityAddress.length > 0) {
      const wallet = this.masterWalletManagerService.createWalletData(
        this.liquidityAddress,
        'manual'
      );
      if (wallet.chain) {
        this.router.navigate(['/liquidity'], {
          queryParams: { wallet: this.liquidityAddress },
        });
      } else {
        this.liquidityAddressMsg = 'The address is not valid';
      }
    } else {
      this.liquidityAddressMsg = 'The address can not be empty';
    }
  }

  goToDetails(asset: string, status: string) {
    if (status == 'available') {
      this.router.navigate(['pool/' + asset]);
    } else {
      this._snackBar.open(this.translation.table.not_available_pool, '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }
  }

  openOperationsModal(
    assetChain: string,
    assetName: string,
    assetFullname: string,
    operationType: string,
    status: string
  ) {
    if (status !== 'available') {
      this._snackBar.open(this.translation.table.not_available_pool, '', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }
    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue === '' || this.themeValue === 'light-theme') {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);

      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    const dialogRef = this.dialog.open(MarketcapOperationsComponent, {
      data: { assetChain, assetName, assetFullname, operationType },
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
    });

    dialogRef.afterClosed().subscribe((result) => {
      //consoleLog(`Dialog result: ${result}`);
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
