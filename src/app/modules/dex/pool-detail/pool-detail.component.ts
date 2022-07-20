import {
  Component,
  OnInit,
  HostBinding,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

import * as moment from 'moment';

import { forkJoin } from 'rxjs';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';

import { MarketcapOperationsComponent } from '@dexShared/dialogs/marketcap-operations/marketcap-operations.component';
import {
  MarketPool,
  PoolDetail,
  HistoryField,
} from '@dexShared/interfaces/marketcap';
import { MatSnackBar } from '@angular/material/snack-bar';

// ICONS
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

/* Master Wallet Manager */
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';
import { Asset } from '../shared/classes/asset';
import { consoleLog } from '@app/utils/consoles';

import { TranslateService } from '@ngx-translate/core';

interface IOptions {
  fullname: string;
  asset: string;
  chain?: string;
  ticket?: string;
}

@Component({
  selector: 'app-pool-detail',
  templateUrl: './pool-detail.component.html',
  styleUrls: ['./pool-detail.component.scss'],
})
export class PoolDetailComponent implements OnInit {
  public innerWidth: any;

  @HostBinding('class') componentCssClass: any;

  public assetAPY: HistoryField[];
  public assetMembers: HistoryField[];
  public BUSDPrice: HistoryField[];
  public DCFAssetPrice: HistoryField[];
  public priceChartHeight: string;
  public stakersChartHeight: string;
  public stakersChartTop: string;
  public priceChartBottom: string;

  @HostListener('window:resize', ['$event']) onResize(event: any) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.priceChartHeight = '400px';
      this.stakersChartHeight = '150px';
      this.priceChartBottom = '38%';
      this.stakersChartTop = '68%';
    } else if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.priceChartHeight = '200px';
      this.stakersChartHeight = '150px';
      this.priceChartBottom = '58%';
      this.stakersChartTop = '48%';
    } else if (this.innerWidth <= 450) {
      this.priceChartHeight = '400px';
      this.stakersChartHeight = '150px';
      this.priceChartBottom = '38%';
      this.stakersChartTop = '68%';
    }

    if (this.priceList && this.APYList && this.membersList) {
      this.getPriceOptions(this.priceList, this.APYList, this.membersList);
    }
  }

  public faQuestionCircle = faQuestionCircle;

  public poolList: MarketPool[] = [];

  public displayedColumns: string[] = [
    'name',
    'price',
    'depth',
    'volume',
    'perc',
    'weeklyChange',
    'graph',
    'status',
  ];
  public dataSource = new MatTableDataSource<MarketPool>(this.poolList);

  public isToggle: boolean;
  public themeValue = '';
  public logoFile: string = 'DecentralFi-footer.svg';
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public bnbAddress: string = '';
  public bnbAddressMask: string;
  public currencyValue: string = 'USD';
  public currencyName: string = 'USD';
  public currencies = [
    { label: 'RUNE', value: 'RUNE' },
    { label: 'USD', value: 'USD' },
  ];

  public statusValue: string = 'MIDGARD API';
  public statuses = [
    { label: 'MIDGARD API', value: 'midgard.thorchain.info' },
    { label: 'THORNODE', value: 'thornode.thorchain.info' },
  ];
  public binanceExplorerUrl: string;
  public walletData: any;
  public poolRatesTablePageSize: any = 100;
  public isLoading = true;
  public sortedData: MarketPool[];

  public totalAllDepth: number;
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

  public asset: string;
  public assetLabel: string;
  public totalVolume: number = 0;
  public totalDepth: number = 0;
  public totalSwaps: number = 0;
  public totalBuys: number = 0;
  public totalSells: number = 0;
  public totalAvgSwapFee: number = 0;
  public totalAvgSwapSize: number = 0;
  public price: number = 0;
  public apy: number = 0;
  public members: number = 0;

  public assetPriceOptions: any;
  public assetStakersOptions: any;
  public chartTheme: string;
  public chartThemePaginator: string;
  public perdiodRangeValue: string = 'last24hr';
  public perdiodRangeLabel: string = '24H';

  public autocompleteClass: string;

  public periods = [
    { label: '24H', value: '24h', interval: 'hour', api: 'last24hr' },
    { label: '7D', value: '7d', interval: 'day', api: 'last7day' },
    { label: '1M', value: '30d', interval: 'day', api: 'lastMonth' },
    { label: '3M', value: '90d', interval: 'week', api: 'last3Month' },
    { label: '1Y', value: '365d', interval: 'week', api: 'lastYear' },
  ];

  myControl = new FormControl();
  options: IOptions[] = [];
  filteredOptions: Observable<IOptions[]>;

  public priceList: any[];
  public APYList: any[];
  public membersList: any[];

  public loaderFile: string =
    '../../../../assets/images/loader/decentralfi-dark.svg';

  public ma5: boolean = false;

  public assetId: number;

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public translation: any;
  public language: string;

  constructor(
    private chartThemeService: GlobalChartsThemeService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private marketcapService: MasterWalletManagerService,
    private _snackBar: MatSnackBar,
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
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value))
    );

    let assetName = new Asset(this.activeRoute.snapshot.params.asset);

    this.asset = this.activeRoute.snapshot.params['asset'];
    this.assetLabel = assetName.chain + '.' + assetName.ticker;

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = false;
      this.logoFile = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = true;
      this.logoFile = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }

    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.priceChartHeight = '400px';
      this.stakersChartHeight = '150px';
      this.priceChartBottom = '38%';
      this.stakersChartTop = '68%';
    } else if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.priceChartHeight = '200px';
      this.stakersChartHeight = '150px';
      this.priceChartBottom = '48%';
      this.stakersChartTop = '58%';
    } else if (this.innerWidth <= 450) {
      this.priceChartHeight = '400px';
      this.stakersChartHeight = '150px';
      this.priceChartBottom = '38%';
      this.stakersChartTop = '68%';
    }

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      if (this.themeValue == null || theme == 'light-theme') {
        this.chartTheme = '#808080';
        this.chartThemePaginator = '#20a8d8';
        this.autocompleteClass = 'dcf-autocomplete-wrapper light';
      } else {
        this.chartTheme = '#ececec';
        this.chartThemePaginator = '#ff9500';
        this.autocompleteClass = 'dcf-autocomplete-wrapper dark';
      }

      if (this.priceList && this.APYList && this.membersList) {
        this.getPriceOptions(this.priceList, this.APYList, this.membersList);
      }
    });

    this.marketcapService.getOriginalPools().subscribe((poolList) => {
      // consoleLog({ poolList });

      if (poolList !== null) {
        let poolListFiltered = poolList.filter(
          (pool) => pool.asset.status == 'available'
        );
        let options: IOptions[] = [];
        for (let i = 0; i < poolListFiltered.length; i++) {
          let assetName = new Asset(poolListFiltered[i].asset.name);

          options.push({
            fullname: assetName.fullname,
            asset: `${assetName.chain}.${assetName.ticker}`,
            chain: assetName.chain,
            ticket: assetName.ticker,
          });
        }

        let poolMatch = poolListFiltered.filter(
          (pool) => pool.asset.name === this.asset
        );

        if (poolMatch.length > 0) {
          this.assetId = poolListFiltered.filter(
            (pool) => pool.asset.name === this.asset
          )[0].asset.id;

          this.options = options;

          this.getTotals();
          this.getGraph();
        } else {
          this._snackBar.open(
            'The pool you are searching is not valid, please select another pool',
            '',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            }
          );
          this.router.navigate(['/']);
        }
      }
    });

    this.marketcapService.currency$.subscribe((currency) => {
      if (currency != null) {
        this.currencyName = currency;
        if (this.options.length > 0) {
          this.getTotals();
          this.getGraph();
        }
      }
    });

    this.marketcapService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('pool_details').subscribe((res: string) => {
        this.translation = res;

        if (this.priceList && this.APYList && this.membersList) {
          this.getPriceOptions(this.priceList, this.APYList, this.membersList);
        }
      });
    });
  }

  private _filter(value: string): IOptions[] {
    const filterValue = value.toLowerCase();
    const chains = {
      ethereum: 'ethereum',
      binance: 'binance',
      bitcoin: 'bitcoin',
      litecoin: 'litecoin',
      bitcoin_cash: 'bitcoincash',
    };
    const empty = filterValue === '';

    return this.options.filter((option) => {
      if (chains.ethereum.includes(filterValue.toLowerCase()) && !empty) {
        return option.chain === 'ETH';
      }
      if (chains.binance.includes(filterValue.toLowerCase()) && !empty) {
        return option.chain === 'BNB';
      }
      if (chains.bitcoin.includes(filterValue.toLowerCase()) && !empty) {
        return option.chain === 'BTC';
      }
      if (chains.bitcoin_cash.includes(filterValue.toLowerCase()) && !empty) {
        return option.chain === 'BCH';
      }
      if (chains.litecoin.includes(filterValue.toLowerCase()) && !empty) {
        return option.chain === 'LTC';
      }
      return option.fullname.toLowerCase().includes(filterValue) === true;
    });
  }

  setWallet(wallet: string) {
    this.bnbAddress = wallet;
    let addressLenght = this.bnbAddress.length;
    this.bnbAddressMask =
      this.bnbAddress.slice(0, 8) +
      '....' +
      this.bnbAddress.slice(addressLenght - 8, addressLenght);
  }

  getGraph() {
    if (
      this.assetAPY != null &&
      this.assetMembers != null &&
      this.BUSDPrice != null &&
      this.DCFAssetPrice != null
    ) {
      this.createGraphData();
    } else {
      let period = this.periods.filter(
        (period) => period.api == this.perdiodRangeValue
      );

      let apiAssetAPY = this.marketcapService.getAssetAPY(period[0].api);
      let apiBUSDPrice = this.marketcapService.getAssetPrice(period[0].api);
      let apiAssetMembers = this.marketcapService.getAssetMembers(
        period[0].api
      );

      forkJoin([apiAssetAPY, apiBUSDPrice, apiAssetMembers]).subscribe(
        (result: [HistoryField[], HistoryField[], HistoryField[]]) => {
          this.assetAPY = result[0].filter(
            (pool) => pool.asset.name == this.asset
          );
          this.assetMembers = result[2].filter(
            (pool) => pool.asset.name == this.asset
          );
          this.BUSDPrice = result[1].filter((pool) =>
            pool.asset.name.includes('BNB.BUSD')
          );
          this.DCFAssetPrice = result[1].filter(
            (pool) => pool.asset.name == this.asset
          );

          this.createGraphData();
        }
      );
    }
  }

  createGraphData() {
    let format = 'D/M/yyyy hh:mm a';

    let priceList = [];

    for (let i = 0; i < this.DCFAssetPrice.length; i++) {
      let price = 0;
      if (this.currencyName == 'USD') {
        price = (1 / +this.BUSDPrice[i].value) * +this.DCFAssetPrice[i].value;
      } else {
        price = +this.DCFAssetPrice[i].value;
      }
      let time = moment(this.DCFAssetPrice[i].time).format(format).toString();
      priceList.push([time, price.toFixed(4)]);
    }

    let APYList = [];
    for (let i = 0; i < this.assetAPY.length; i++) {
      let apy = this.assetAPY[i].value;
      let time = moment(this.assetAPY[i].time).format(format).toString();
      APYList.push([time, (apy * 100).toFixed(2)]);
    }

    let membersList = [];
    for (let i = 0; i < this.assetMembers.length; i++) {
      let members = this.assetMembers[i].value;
      let time = moment(this.assetMembers[i].time).format(format).toString();
      membersList.push([time, members]);
    }

    this.priceList = priceList;
    this.APYList = APYList;
    this.membersList = membersList;

    this.getPriceOptions(priceList, APYList, membersList);
  }

  getTotals() {
    this.marketcapService
      .getStatsDetail(
        this.asset,
        this.perdiodRangeValue,
        this.currencyName,
        this.assetId
      )
      .subscribe(
        (detail: PoolDetail[]) => {
          if (this.poolList.length === 0) {
            this.poolList = detail;
          } else {
            let poolDetail: PoolDetail[] = [
              {
                rank: detail[0].rank,
                name: detail[0].name,
                asset: detail[0].asset,
                chain: detail[0].chain,
                price: detail[0].price,
                depth: detail[0].depth,
                volume: detail[0].volume,
                perc: detail[0].perc,
                weeklyChange: detail[0].weeklyChange,
                swaps: detail[0].swaps,
                buys: detail[0].buys,
                sells: detail[0].sells,
                swapFee: detail[0].swapFee,
                members: detail[0].members,
                apy: detail[0].apy,
                swapSize: detail[0].swapSize,
                graph: detail[0].graph,
                status: detail[0].status,
                isLoading: false,
              },
            ];

            this.poolList = poolDetail;
          }

          this.totalVolume = detail[0].volume;
          this.totalDepth = detail[0].depth;
          this.totalSwaps = detail[0].swaps;
          this.totalBuys = detail[0].buys;
          this.totalSells = detail[0].sells;
          this.totalAvgSwapFee = detail[0].swapFee;
          this.price = detail[0].price;
          this.members = detail[0].members;
          this.apy = detail[0].apy;
          this.totalAvgSwapSize = detail[0].swapSize;

          this.dataSource = new MatTableDataSource(this.poolList);
          this.dataSource.paginator = this.paginator;
        },
        (error) => {
          if (error.error.details == 'Pool is in terminated state') {
            this._snackBar.open(
              'This Pool is not Available, please select another pool',
              '',
              {
                duration: 5000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
              }
            );
            this.router.navigate(['/']);
          }
        }
      );
  }

  getPriceOptions(priceList: any[], APYList: any[], membersList: any[]) {
    let minMaxPrice = this.getMinMaxInterval(priceList);
    let minMaxAPY = this.getMinMaxInterval(APYList);

    let MA5: any[] = [];
    if (this.ma5 == true) {
      MA5 = this.calculateMA(5, priceList);
    }

    this.assetPriceOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            fontFamily: 'Inner Lato',
            backgroundColor: 'rgba(32,168,216,0.7)',
          },
        },
        textStyle: {
          fontFamily: 'Inner Lato',
          color: "#ffffff"
        },
        backgroundColor: 'rgba(32,168,216,0.7)'
      },
      legend: {
        icon: 'roundRect',
        data: [this.translation.details.price, this.translation.details.pool_apy, this.translation.details.members],
        align: 'right',
        width: '100%',
        textStyle: {
          fontFamily: 'Inner Lato',
          color: this.chartTheme,
        },
      },
      dataZoom: [
        {
          xAxisIndex: [0, 1],
          type: 'inside',
          realtime: true,
          start: 0,
          end: 100,
        },
      ],
      grid: [
        {
          id: 0,
          bottom: this.priceChartBottom,
          height: this.priceChartHeight,
          //width: '70%',
        },
        {
          id: 1,
          top: this.stakersChartTop,
          height: this.stakersChartHeight,
        },
      ],
      xAxis: [
        {
          gridIndex: 0,
          type: 'category',
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
        {
          gridIndex: 1,
          show: false,
          type: 'category',
          position: 'top',
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
      ],
      yAxis: [
        {
          gridIndex: 0,
          type: 'value',
          name: this.translation.details.price + ' (' + this.getSimbol() + ')',
          min: minMaxPrice[0],
          max: minMaxPrice[1],
          interval: minMaxPrice[2],
          show: true,
          nameTextStyle: {
            fontFamily: 'Inner Lato',
            color: '#20a8d8',
            fontWeight: 'bold',
            fontSize: 16,
            align: 'left',
          },
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
        {
          gridIndex: 0,
          type: 'value',
          name: this.translation.details.pool_apy + ' (%)',
          min: minMaxAPY[0],
          max: minMaxAPY[1],
          interval: minMaxAPY[2],
          nameLocation: 'end',
          nameTextStyle: {
            fontFamily: 'Inner Lato',
            color: '#BE29E2',
            fontWeight: 'bold',
            fontSize: 16,
            align: 'right',
          },
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
        {
          gridIndex: 1,
          name: this.translation.details.members,
          inverse: true,
          nameTextStyle: {
            fontFamily: 'Inner Lato',
            color: '#20a8d8',
            fontWeight: 'bold',
            fontSize: 16,
            align: 'left',
          },
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
      ],
      toolbox: {
        show: true,
        right: '10%',
        feature: {
          saveAsImage: {
            show: true,
            title: 'Save as Image',
            name: 'decentralfiChart',
          },
        },
        iconStyle: {
          borderColor: this.chartTheme,
        },
      },
      series: [
        this.getMA5Series(MA5),
        this.getPriceChartSeries(priceList),
        this.getAPYChartSeries(APYList),
        this.getStakersChartSeries(membersList),
      ],
    };
  }

  getStakersChartSeries(membersList: any[]) {
    let series = membersList;

    return {
      name: this.translation.details.members,
      type: 'bar',
      yAxisIndex: 2,
      xAxisIndex: 1,
      data: series,
      emphasis: {
        itemStyle: {
          color: '#20A8D8',
          borderColor: '#20A8D8',
        },
      },
      itemStyle: {
        color: '#20A8D8',
      },
    };
  }

  getAPYChartSeries(APYList: any[]) {
    let series = APYList;
    return {
      name: this.translation.details.pool_apy,
      data: series,
      type: 'line',
      yAxisIndex: 1,
      xAxisIndex: 0,
      itemStyle: {
        normal: {
          color: '#BE29E2',
          borderColor: '#BE29E2',
          opacity: 1,
        },
        emphasis: {
          color: '#ffffff',
          borderColor: '#BE29E2',
          borderWidth: 2,
          opacity: 1,
        },
      },
      lineStyle: {
        normal: {
          color: '#BE29E2',
        },
      },
    };
  }

  getPriceChartSeries(priceList: any[]) {
    let series = priceList;

    return {
      name: this.translation.details.price,
      data: series,
      type: 'line',
      yAxisIndex: 0,
      xAxisIndex: 0,
      itemStyle: {
        normal: {
          color: '#188df0',
          borderColor: '#188df0',
          opacity: 1,
        },
        emphasis: {
          color: '#ffffff',
          borderColor: '#188df0',
          borderWidth: 2,
          opacity: 1,
        },
      },
      lineStyle: {
        normal: {
          color: '#188df0',
        },
      },
    };
  }

  getMA5Series(ma5: any[]) {
    let series = ma5;
    let seriesObj = {};

    if (this.ma5 == true) {
      seriesObj = {
        name: 'MA5',
        data: series,
        type: 'line',
        yAxisIndex: 0,
        xAxisIndex: 0,
        itemStyle: {
          normal: {
            color: '#c23531',
            borderColor: '#c23531',
            opacity: 1,
          },
          emphasis: {
            color: '#ffffff',
            borderColor: '#c23531',
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: '#c23531',
          },
        },
      };
    } else {
      seriesObj = {
        name: 'MA5',
        data: [],
        type: 'line',
        yAxisIndex: 0,
        xAxisIndex: 0,
        itemStyle: {
          normal: {
            color: '#c23531',
            borderColor: '#c23531',
            opacity: 1,
          },
          emphasis: {
            color: '#ffffff',
            borderColor: '#c23531',
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: '#c23531',
          },
        },
      };
    }

    return seriesObj;
  }

  processPoolstable(poolList: MarketPool[]) {
    //for top bar
    let activePoolsList = poolList.filter((pool) => pool.status == 'available');
    let totalDepth = 0;
    let totalVolume24H = 0;
    for (let i = 0; i < activePoolsList.length; i++) {
      totalDepth = totalDepth + activePoolsList[i].depth;
      totalVolume24H = totalVolume24H + activePoolsList[i].volume;
    }

    this.dataSource = new MatTableDataSource(poolList);
    this.dataSource.paginator = this.paginator;
  }

  getMinValue(priceList: any[]) {
    return priceList.reduce(function (p, v) {
      return +p[1] < +v[1] ? +p[1] : +v[1];
    });
  }

  setTheme() {
    if (this.themeValue == 'light-theme') {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.logoFile = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    } else {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.logoFile = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }
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

  goTo(link: string) {
    window.open(link, '_blank');
  }

  orderDotsAsc(array: any[]) {
    return Array.from(array).sort((a: any, b: any) => {
      if (+a[1] < +b[1]) {
        return -1;
      } else if (+a[1] > +b[1]) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  getMinMaxInterval(array: any[]) {
    let sorted = Array.from(array).sort((a: any, b: any) => {
      if (+a[1] < +b[1]) {
        return -1;
      } else if (+a[1] > +b[1]) {
        return 1;
      } else {
        return 0;
      }
    });

    let min = +sorted[0][1] - +sorted[0][1] * 0.1;
    let max =
      +sorted[sorted.length - 1][1] + +sorted[sorted.length - 1][1] * 0.1;
    let roundMin = Math.floor(min);
    let roundMax = Math.ceil(max);
    let difference = roundMax - roundMin;
    let interval = difference / 8;

    return [roundMin, roundMax, interval];
  }

  calculateMA(dayCount: number, data: any[]) {
    var result = [];
    for (var i = 0, len = data.length; i < len; i++) {
      if (i < dayCount) {
        result.push('-');
        continue;
      }
      var sum = 0;
      for (var j = 0; j < dayCount; j++) {
        sum += +data[i - j][1];
      }
      result.push((sum / dayCount).toFixed(2));
    }
    return result;
  }

  showMA5() {
    this.ma5 == false ? (this.ma5 = true) : (this.ma5 = false);

    this.createGraphData();
  }

  setColor(label: string) {
    if (this.perdiodRangeLabel === label) {
      return 'accent';
    } else {
      return 'grey';
    }
  }

  tdColor() {
    if (localStorage.getItem('dcf-theme') == 'light-theme') {
      return 'td-stiky-ligth';
    } else {
      return 'td-stiky-dark';
    }
  }

  getPeriod(value: string, label: string) {
    if (this.perdiodRangeValue != value) {
      this.perdiodRangeValue = value;
      this.perdiodRangeLabel = label;
    } else {
      this.perdiodRangeValue = 'last24hr';
      this.perdiodRangeLabel = '24H';
    }

    this.assetAPY = null;
    this.assetMembers = null;
    this.BUSDPrice = null;
    this.DCFAssetPrice = null;

    this.getTotals();
    this.getGraph();
  }

  public goToPool(pool: string) {
    window.open('pool/' + pool, '_self');
  }

  goBack() {
    this.router.navigate(['/']);
  }

  openSwapModal(
    assetChain: string,
    assetName: string,
    assetFullname: string,
    operationType: string,
    status: string
  ) {
    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
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
      consoleLog(`Dialog result: ${result}`);
    });
  }

  tdColorOne() {
    if (localStorage.getItem('dcf-theme') == 'light-theme') {
      return 'td-stiky-ligth1';
    } else {
      return 'td-stiky-dark1';
    }
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
