import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { graphic } from 'echarts';
import { LoaderService } from '../shared/services/loader.service';
import { GlobalCurrencyService } from '../shared/services/global-currency.service';
import { GlobalTimePeriodService } from '../shared/services/global-time-period.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { NetworkChainService } from '../shared/services/network-chain.service';
import { PoolratesService } from '../shared/services/poolrates.service';
import {
  PoolRates,
  PoolRatesTable,
  Chart,
  AssetPoints,
  EndpointAsset,
  Totals,
} from '../shared/interfaces/poolrates';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';
import { Asset } from '@dexShared/classes/asset';
import * as moment from 'moment';
import { consoleLog } from '@app/utils/consoles';

const moduleFields: any[] = [
  { field: 'staked', label: 'Total Pool Deposited', type: 'currency' },
  { field: 'stakers', label: 'Total Stakers', type: 'integer' },
  { field: 'roi', label: 'Average ROI (%)', type: 'percentage' },
  { field: 'price', label: 'Price', type: 'integer' },
];

const ELEMENT_DATA: PoolRatesTable[] = [
  {
    asset: new Asset('THOR.RUNE'),
    depth: 0,
    price: 0,
    roi: 0,
    slip: 0,
    stakers: 0,
    staked: 0,
    swaps: 0,
    volume: 0,
  },
];
const CHART_COLORS = [
  '#22DBBF',
  '#34C73B',
  '#00A2FF',
  '#EB5353',
  '#FF9800',
  '#FFEC3A',
  '#8CC34A',
  '#2096F3',
  '#3F51B5',
  '#673AB7',
];

@Component({
  selector: 'app-poolrates',
  templateUrl: './poolrates.component.html',
  styleUrls: ['./poolrates.component.scss'],
})
export class PoolratesComponent implements OnInit {
  public echartsIntance: any;

  public faQuestionCircle = faQuestionCircle;
  public selectedPoolCategories: any;
  public selectedPoolCategoriesLabel: any;
  public allLabel: string = 'All';
  public selectedParam: string = 'roi';
  public valueLabel: string;
  public options: any;
  public assetPriceOptions: any;
  public assetStakersOptions: any;
  public dynamicData: any;

  public poolRatesModule: PoolRates;
  public originalPoolRatesModule: PoolRates;
  public perdiodRangeLabel: string = 'last24hr';
  public perdiodRangeValue: string = '24H';
  public loaderCounter: number = 0;
  public lastUpdatedLabel = moment().format('MM/DD/YYYY HH:[00]');
  public lastUpdatedFlag: boolean = false;
  public defaultAssetLogo: string =
    'https://unpkg.com/cryptoicons-cdn/images/RUNE.png';
  public poolratesTable: PoolRatesTable[];
  public poolRatesTablePageSize: any = 10;
  public priceChart: any;
  public stakersChart: any;
  public roiChart: any;
  public pools = [
    {
      asset: {
        chain: 'BNB',
        ticker: 'RUNE',
        iconPath: 'https://unpkg.com/cryptoicons-cdn/images/RUNE.png',
      },
      depth: 0,
      value: 0,
    },
  ];
  public isLoading = false;
  public selectedAsset: string;
  public assetLastPrice: number;
  public assetVolume: number;
  public assetROI: number;
  public chartTheme: string;
  public chartThemePaginator: string;
  public currency: any;
  public loaderCounterLimit: number = 10;
  public duration: moment.Duration;

  public displayedColumns: string[] = [
    'pool',
    'asset',
    'price',
    'depth',
    'volume',
    'swaps',
    'roi',
    'stakers',
    'slip',
  ];
  public dataSource = new MatTableDataSource(ELEMENT_DATA);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  public initFlag: number = 0;

  public testCounter = 0;
  public networkValue = 'multichain_chaosnet';

  constructor(
    private loaderService: LoaderService,
    private currencyService: GlobalCurrencyService,
    private timePeriodService: GlobalTimePeriodService,
    private chartThemeService: GlobalChartsThemeService,
    private poolratesService: PoolratesService,
    private roundedPipe: RoundedValuePipe,
    private networkChainService: NetworkChainService
  ) {}

  ngOnInit() {
    /* Master object to handle module's data */

    this.poolRatesModule = {
      staked: {
        total: 0,
        tooltip: '',
        table: [
          {
            rank: 0,
            asset: {
              fullname: 'THOR.THOR',
              nameChain: 'THOR.THOR',
              chain: 'THOR',
              symbol: 'THOR',
              ticker: 'THOR',
              iconPath:
                'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',
            },
            depth: '',
            value: 0,
          },
        ],
        chart: {
          labels: [''],
          assetPoints: [
            {
              asset: '',
              points: [0],
            },
          ],
        },
      },
      stakers: {
        total: 0,
        tooltip: '',
        table: [
          {
            rank: 0,
            asset: {
              fullname: 'THOR.THOR',
              nameChain: 'THOR.THOR',
              chain: 'THOR',
              symbol: 'THOR',
              ticker: 'THOR',
              iconPath:
                'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',
            },
            depth: '',
            value: 0,
          },
        ],
        chart: {
          labels: [''],
          assetPoints: [
            {
              asset: '',
              points: [0],
            },
          ],
        },
      },
      roi: {
        total: 0,
        tooltip: '',
        table: [
          {
            rank: 0,
            asset: {
              fullname: 'THOR.THOR',
              nameChain: 'THOR.THOR',
              chain: 'THOR',
              symbol: 'THOR',
              ticker: 'THOR',
              iconPath:
                'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',
            },
            depth: '',
            value: 0,
          },
        ],
        chart: {
          labels: [''],
          assetPoints: [
            {
              asset: '',
              points: [0],
            },
          ],
        },
      },
      price: {
        total: 0,
        tooltip: '',
        table: [
          {
            rank: 0,
            asset: {
              fullname: 'THOR.THOR',
              nameChain: 'THOR.THOR',
              chain: 'THOR',
              symbol: 'THOR',
              ticker: 'THOR',
              iconPath:
                'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',
            },
            depth: '',
            value: 0,
          },
        ],
        chart: {
          labels: [''],
          assetPoints: [
            {
              asset: '',
              points: [0],
            },
          ],
        },
      },
    };

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      if (theme == 'light-theme') {
        this.chartTheme = '#808080';
        this.chartThemePaginator = '#20a8d8';
      } else {
        this.chartTheme = '#ececec';
        this.chartThemePaginator = '#ff9500';
      }
      this.setOptions();
      if (this.poolratesTable) {
        this.setLastSectionOptions();
      }
    });

    this.chartThemeService.getToggleSidebar().subscribe((toggle) => {
      if (toggle == true) {
        setTimeout(() => {
          this.echartsIntance.resize();
        }, 300);
      }
    });

    this.perdiodRangeLabel = this.timePeriodService.getGlobalTimePeriodValue();

    this.currencyService.getGlobalCurrency().subscribe((currency) => {
      let price = currency.price;
      if (currency.label == 'RUNE') {
        price = 1;
      }

      /** UPDATE PoolRates Table by currency */
      this.poolratesService
        .getOriginalPoolRatesTable()
        .subscribe((originalPoolratesTable: PoolRatesTable[]) => {
          if (originalPoolratesTable != null && this.poolratesTable) {
            const constOriginalPoolRatesTable = originalPoolratesTable;

            let tempPoolRatesTable = [];
            for (let i = 0; i < this.poolratesTable.length; i++) {
              let rowdepth = constOriginalPoolRatesTable[i].depth / price;
              let rowprice = constOriginalPoolRatesTable[i].price / price;
              let rowslip = constOriginalPoolRatesTable[i].slip / price;
              let rowstaked = constOriginalPoolRatesTable[i].staked / price;
              let rowvolume = constOriginalPoolRatesTable[i].volume / price;
              let row = {
                asset: this.poolratesTable[i].asset,
                depth: rowdepth,
                price: rowprice,
                roi: this.poolratesTable[i].roi,
                slip: rowslip,
                staked: rowstaked,
                stakers: this.poolratesTable[i].stakers,
                swaps: this.poolratesTable[i].swaps,
                volume: rowvolume,
              };
              tempPoolRatesTable.push(row);
            }

            this.poolratesTable = tempPoolRatesTable;
            consoleLog(tempPoolRatesTable);

            this.dataSource = new MatTableDataSource(this.poolratesTable);
            this.dataSource.paginator = this.paginator;
            if (this.sort.active != 'roi') {
              this.sort.sort({ id: 'roi', start: 'desc' } as MatSortable);
            }
            this.dataSource.sort = this.sort;

            if (this.dataSource.paginator) {
              this.dataSource.paginator.firstPage();
            }
          }
        });
      /**----------------------- */
      /** UPDATE Totals by currency */

      this.poolratesService
        .getOriginalPoolRatesModule()
        .subscribe((poolratesModule) => {
          if (poolratesModule != null && this.poolRatesModule) {
            let tempPoolratesModule = {};
            for (let i = 0; i < moduleFields.length; i++) {
              let poolrates;
              if (
                moduleFields[i].field == 'roi' ||
                moduleFields[i].field == 'stakers'
              ) {
                let poolRatesTable =
                  poolratesModule[moduleFields[i].field].table;
                let tempTable = [];
                for (let x = 0; x < poolRatesTable.length; x++) {
                  let item = {
                    rank: x + 1,
                    asset: poolRatesTable[x].asset,
                    depth: poolRatesTable[x].depth / price,
                    value: poolRatesTable[x].value,
                  };
                  tempTable.push(item);
                }

                poolrates = {
                  chart: poolratesModule[moduleFields[i].field].chart,
                  table: tempTable,
                  tootip: poolratesModule[moduleFields[i].field].tooltip,
                  total: poolratesModule[moduleFields[i].field].total,
                };

                //this.poolRatesModule[moduleFields[i].field].table = poolTable;
              } else {
                let poolRatesTable =
                  poolratesModule[moduleFields[i].field].table;
                let tempTable = [];
                for (let x = 0; x < poolRatesTable.length; x++) {
                  let item = {
                    rank: x + 1,
                    asset: poolRatesTable[x].asset,
                    depth: poolRatesTable[x].depth / price,
                    value: poolRatesTable[x].value / price,
                  };
                  tempTable.push(item);
                }

                let poolRatesChart =
                  poolratesModule[moduleFields[i].field].chart.assetPoints;
                let poolRatesRawChart =
                  poolratesModule[moduleFields[i].field].chart.rawChart;
                let chart = {};
                let assetPoints = [];

                for (let y = 0; y < poolRatesChart.length; y++) {
                  let assetPoint = {};
                  let points = [];
                  for (let z = 0; z < poolRatesChart[y].points.length; z++) {
                    let point = [
                      poolRatesChart[y].points[z][0],
                      (+poolRatesChart[y].points[z][1] / price).toFixed(2),
                    ];
                    points.push(point);
                  }
                  assetPoint = {
                    asset: poolRatesChart[y].asset,
                    points: points,
                  };
                  assetPoints.push(assetPoint);
                }

                let tempPoolRatesRawChart = [];
                for (let a = 0; a < poolRatesRawChart.length; a++) {
                  let rawChartRow = {
                    asset: poolRatesRawChart[a].asset,
                    field: poolRatesRawChart[a].field,
                    last_time: poolRatesRawChart[a].last_time,
                    node_ip: poolRatesRawChart[a].node_ip,
                    response_success: poolRatesRawChart[a].response_success,
                    time: poolRatesRawChart[a].time,
                    value: poolRatesRawChart[a].value / price,
                  };

                  tempPoolRatesRawChart.push(rawChartRow);
                }

                chart = {
                  assetPoints: assetPoints,
                  labels: poolratesModule[moduleFields[i].field].chart.labels,
                  rawChart: tempPoolRatesRawChart,
                };

                poolrates = {
                  chart: chart,
                  table: tempTable,
                  tootip: poolratesModule[moduleFields[i].field].tooltip,
                  total: poolratesModule[moduleFields[i].field].total / price,
                };

                //this.poolRatesModule[moduleFields[i].field].table = poolTable;
              }

              tempPoolratesModule[moduleFields[i].field] = poolrates;
            }
            //consoleLog(tempPoolratesModule);
            //consoleLog(this.poolRatesModule);
            this.poolRatesModule = tempPoolratesModule;
            this.pools = tempPoolratesModule[this.selectedParam].table;
            let selectedRow = this.poolratesTable.filter(
              (selected) =>
                selected.asset.chain + '.' + selected.asset.ticker ==
                this.selectedAsset
            );
            this.onChange(selectedRow[0]);
          }
          this.setOptions();
        });

      /**----------------------- */
    });

    /* Here is where we subscribe to global time period */
    this.timePeriodService.getGlobalTimePeriod().subscribe((period) => {
      this.loaderService.loaderShow(this.loaderCounterLimit);

      this.perdiodRangeLabel = period;

      this.getMiniCardClass('roi');
      this.paramSelect('roi', 'Average ROI (%)');

      this.executeQuery();
    });

    /* Here is where we subscribe to global networkchain */
    this.networkChainService.getGlobalNetwork().subscribe((network) => {
      this.loaderService.loaderShow(this.loaderCounterLimit);

      this.networkValue = network;

      this.getMiniCardClass('roi');
      this.paramSelect('roi', 'Average ROI (%)');

      this.executeQuery();
    });

    this.automaticQuery();

    this.selectedPoolCategories = ['Stablecoins', 'Cryptocurrencies', 'Tokens'];
  }

  /* This to predict next hour where backend to recolect data and we run query 2 minutes later*/
  automaticQuery() {
    let baseHour = moment().format('MM/DD/YYYY HH:[00]');
    let actualHour = moment();
    let nextHour = moment(baseHour).add(1, 'hour').add(2, 'minutes');
    this.duration = moment.duration(nextHour.diff(actualHour));

    setTimeout(() => {
      this.executeQuery();
      this.automaticQuery();
    }, this.duration.asMilliseconds());
  }

  executeQuery() {
    this.initFlag = this.initFlag + 1;

    if (this.initFlag > 1) {
      this.initFlag = 0;
      return;
    }

    /** POOLRATES TABLE */
    this.poolratesService
      .getPoolratesTable(
        this.perdiodRangeLabel,
        this.networkValue,
        this.currency
      )
      .subscribe((data) => {
        this.poolratesTable = data;
        this.dataSource = new MatTableDataSource(this.poolratesTable);
        consoleLog('poolrates');
        this.setHideLoader();
        this.processPoolsTables(data);
      });

    /**TOTALS */
    this.poolratesService
      .getTotals(this.perdiodRangeLabel, this.networkValue)
      .subscribe((totals) => {
        for (let i = 0; i < moduleFields.length; i++) {
          this.poolRatesModule[moduleFields[i].field].total =
            totals[moduleFields[i].field];
          this.poolRatesModule[moduleFields[i].field].tooltip =
            totals['tooltip_' + moduleFields[i].field];
          consoleLog('totals');
          this.setHideLoader();
        }
      });
  }

  processPoolsTables(data: PoolRatesTable[]) {
    let priceCounter = 0;
    for (let i = 0; i < moduleFields.length; i++) {
      let orderedData = this.orderTableByFieldDesc(data, moduleFields[i].field);
      let slicedData = orderedData.slice(0, 10);
      let poolTable = [];
      for (let x = 0; x < slicedData.length; x++) {
        let value: number;
        if (moduleFields[i].field == 'roi') {
          value = slicedData[x][moduleFields[i].field] * 100;
        } else {
          value = slicedData[x][moduleFields[i].field];
        }
        let item = {
          rank: x + 1,
          asset: slicedData[x].asset,
          depth: slicedData[x].depth,
          value: value,
        };
        poolTable.push(item);
      }

      this.poolRatesModule[moduleFields[i].field].table = poolTable;
      if (moduleFields[i].field == 'roi') {
        consoleLog('roi tables');
        this.setHideLoader();
      }

      /**HISTORY */
      this.poolratesService
        .getHistory(
          moduleFields[i].field,
          this.perdiodRangeLabel,
          this.networkValue,
          slicedData
        )
        .subscribe(
          (data: Chart) => {
            this.poolRatesModule[moduleFields[i].field].chart = data;
            if (moduleFields[i].field == 'roi') {
              consoleLog('roi chart');
              this.setHideLoader();
            }

            if (moduleFields[i].field == 'roi') {
              this.roiChart = data.rawChart;
            } else if (moduleFields[i].field == 'stakers') {
              this.stakersChart = data.rawChart;
            }
            if (moduleFields[i].field == this.selectedParam) {
              this.setOptions();

              this.dataSource = new MatTableDataSource(this.poolratesTable);
              this.dataSource.paginator = this.paginator;
              if (this.sort.active != 'roi') {
                this.sort.sort({ id: 'roi', start: 'desc' } as MatSortable);
              }
              this.dataSource.sort = this.sort;

              if (this.dataSource.paginator) {
                this.dataSource.paginator.firstPage();
              }

              this.pools = poolTable;
            }

            if (
              moduleFields[i].field == 'roi' ||
              moduleFields[i].field == 'stakers' ||
              moduleFields[i].field == 'price'
            ) {
              priceCounter++;
              consoleLog('price chart');
              this.setHideLoader();
              if (priceCounter == 3) {
                this.onChange(this.poolratesTable[0]);
              }
            }
          },
          (error) => {
            consoleLog(
              'error loading ' + moduleFields[i].field + ' chart data: ' + error
            );
            this.setHideLoader();
          }
        );
      /** */
    }
  }

  getSimbol() {
    if (this.selectedParam == 'roi') {
      return '%';
    }
  }

  processDataChart(field, array, asset) {
    let chart: AssetPoints;
    let value: any;

    chart = {
      asset: asset,
      points: [],
    };

    for (let i = 0; i < array.length; i++) {
      if (field == 'roi') {
        value = [
          moment(array[i].time).format('MM/DD/YYYY HH:[00]'),
          (array[i].value * 100).toFixed(2),
        ];
      } else if (field == 'stakers') {
        value = [
          moment(array[i].time).format('MM/DD/YYYY HH:[00]'),
          array[i].value.toFixed(2),
        ];
      } else {
        value = [
          moment(array[i].time).format('MM/DD/YYYY HH:[00]'),
          (array[i].value / 100000000).toFixed(2),
        ];
      }

      chart.points.push(value);
    }

    if (this.lastUpdatedFlag == false) {
      let arrayLen = array.length;
      this.lastUpdatedLabel = moment(array[arrayLen - 1].time).format(
        'MM/DD/YYYY HH:[00]'
      );
      this.lastUpdatedFlag = true;
    }

    return chart;
  }

  orderDataAscbyValue(array) {
    return Array.from(array).sort((a: any, b: any) => {
      if (a['total_pool'] > b['total_pool']) {
        return -1;
      } else if (a['total_pool'] < b['total_pool']) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filterPredicate = function (data, filter: string): boolean {
      return (
        data.asset.ticker.toLowerCase().includes(filter) ||
        data.asset.chain.toLowerCase().includes(filter)
      );
    };

    let newfilteredData = [];

    for (let i = 0; i < this.poolratesTable.length; i++) {
      let predicate = this.dataSource.filterPredicate(
        this.poolratesTable[i],
        filterValue
      );
      if (predicate == true) {
        newfilteredData.push(this.poolratesTable[i]);
      }
    }

    this.dataSource = new MatTableDataSource(newfilteredData);
    this.dataSource.paginator = this.paginator;
    if (this.sort.active != 'roi') {
      this.sort.sort({ id: 'roi', start: 'desc' } as MatSortable);
    }
    this.dataSource.sort = this.sort;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public getChartName() {
    return this.selectedParam.toUpperCase();
  }

  public getPoolsCategory() {
    if (
      this.selectedPoolCategories.length == 0 ||
      this.selectedPoolCategories.length == 3
    ) {
      this.selectedPoolCategories = [
        'Stablecoins',
        'Cryptocurrencies',
        'Tokens',
      ];
      this.allLabel = 'All';
    }
    if (this.selectedPoolCategories.length < 3) {
      this.allLabel = '';
    }
  }

  setHideLoader() {
    this.loaderCounter++;

    consoleLog(this.loaderCounter + ' == ' + this.loaderCounterLimit);
    if (this.loaderCounter == this.loaderCounterLimit) {
      setTimeout(() => {
        this.loaderService.loaderHide(this.loaderCounter);
        this.loaderCounter = 0;
        this.initFlag = 0;

        this.poolratesService.setOriginalPoolRatesModule(this.poolRatesModule);

        consoleLog(this.poolRatesModule);
        consoleLog(this.poolratesTable);
      }, 500);
    } else {
      this.loaderService.loaderHide(this.loaderCounter);
    }
  }

  setPoolRatesCharts() {
    for (let i = 0; i < this.poolratesTable.length; i++) {
      let roiChart = this.setPoolRatesChartsByField(
        'roi',
        this.poolratesTable[i],
        this.roiChart
      );
      let priceChart = this.setPoolRatesChartsByField(
        'price',
        this.poolratesTable[i],
        this.priceChart
      );
      let stakersChart = this.setPoolRatesChartsByField(
        'stakers',
        this.poolratesTable[i],
        this.stakersChart
      );

      let charts: Chart[] = [roiChart, priceChart, stakersChart];
      this.poolratesTable[i].charts = charts;
    }
  }

  setPoolRatesChartsByField(
    label: string,
    poolratesRow: PoolRatesTable,
    fieldChart: EndpointAsset[]
  ) {
    let chart: Chart = {
      labels: [label],
      assetPoints: [],
    };

    let assetPoints: AssetPoints = {
      asset: '',
      points: [],
    };

    poolratesRow.charts = [];

    let poolName = poolratesRow.asset.ticker;

    for (let x = 0; x < fieldChart[label].length; x++) {
      let findDot = fieldChart[label][x].asset.name.indexOf('.');
      let chartassetName = fieldChart[label][x].asset.name.substr(findDot + 1);
      if (chartassetName == poolName) {
        for (let i = 0; i < fieldChart[label][x].pool.length; i++) {
          let time = moment(fieldChart[label][x].pool[i].time).format(
            'MM/DD/YYYY HH:[00]'
          );
          let value: any;
          if (label == 'roi') {
            value = (fieldChart[label][x].pool[i].value * 100).toFixed(2);
          } else if (label == 'price') {
            value = fieldChart[label][x].pool[i].value.toFixed(4);
          } else {
            value = fieldChart[label][x].pool[i].value.toFixed(0);
          }
          let element = [time, value];
          assetPoints.asset = poolName;
          assetPoints.points.push(element);
        }
      }
    }

    chart.assetPoints.push(assetPoints);

    return chart;
  }

  paramSelect(param: string, label: string) {
    this.selectedParam = param;
    this.valueLabel = label;
    this.pools = this.poolRatesModule[this.selectedParam].table;
    this.setOptions();
  }

  getMiniCardClass(param) {
    if (param == this.selectedParam) {
      return 'mini-card-selected';
    } else {
      return 'mini-card';
    }
  }

  setPaginatorPageSize(size: number) {
    this.poolRatesTablePageSize = size;
    this.paginator.pageSize = size;
    this.dataSource.paginator = this.paginator;
    if (this.sort.active != 'roi') {
      this.sort.sort({ id: 'roi', start: 'desc' } as MatSortable);
    }
    this.dataSource.sort = this.sort;
  }

  getPaginatorClass(size) {
    if (size == this.poolRatesTablePageSize) {
      return 'page-size-selected';
    } else {
      return 'page-size';
    }
  }

  processDataChartLabels(array) {
    let labels = [];
    for (let i = 0; i < array.length; i++) {
      labels.push(array[i].asset);
    }

    return labels;
  }

  getChartLegend() {
    return this.poolRatesModule[this.selectedParam].chart.labels;
  }

  getYAxisDataName() {
    return this.valueLabel;
  }

  setOptions() {
    this.options = {
      tooltip: {
        trigger: 'axis', //'axis' para ver todas las intercepciones juntas en el tooltip
        axisPointer: {
          type: 'cross',
          label: {
            fontFamily: 'Inner Lato',
            backgroundColor: 'rgba(32,168,216,0.7)',
          },
        },
        textStyle: {
          fontFamily: 'Inner Lato',
        },
        backgroundColor: 'rgba(32,168,216,0.7)',
      },
      legend: {
        type: 'scroll',
        icon: 'roundRect',
        data: this.getChartLegend(),
        align: 'right',
        width: '80%',
        textStyle: {
          fontFamily: 'Inner Lato',
          color: this.chartTheme,
        },
        pageTextStyle: {
          fontFamily: 'Inner Lato',
          color: this.chartTheme,
        },
        pageIconColor: this.chartThemePaginator,
      },
      toolbox: {
        show: true,
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
      grid: {
        left: '0%',
        right: '5%',
        //height: 650,
        //width: 990,
        bottom: 0,
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
          //data: this.getXAxisData()
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: this.getYAxisDataName(),
          nameTextStyle: {
            fontFamily: 'Inner Lato',
            color: '#20a8d8',
            fontWeight: 'bold',
            fontSize: 15,
            align: 'left',
          },
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
      ],
      series: this.getChartSeries(),
    };
  }

  getSeriesStep() {
    if (this.selectedParam == 'roi') {
      return 'start';
    } else {
      return false;
    }
  }

  getSeriesStack() {
    if (this.selectedParam != 'roi') {
      return 'counts';
    } else {
      return false;
    }
  }

  getChartSeriesAresStyle(color) {
    if (this.selectedParam != 'roi') {
      return {
        normal: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color },
            { offset: 0.7, color: color },
            { offset: 1, color: 'rgba(255, 255, 255, 0.3)' },
          ]),
        },
      };
    } else {
      return {
        normal: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 255, 255, 0)' },
          ]),
        },
      };
    }
  }

  getChartSeries() {
    let series = [];

    let array = this.poolRatesModule[this.selectedParam].chart.assetPoints;

    for (let i = 0; i < array.length; i++) {
      let serie = {
        name: array[i].asset,
        type: 'line',
        step: this.getSeriesStep(), // only for averages
        smooth: false,
        stack: this.getSeriesStack(), // only for totals
        itemStyle: {
          normal: {
            color: CHART_COLORS[i],
            borderColor: CHART_COLORS[i],
            opacity: 1,
          },
          emphasis: {
            color: '#ffffff',
            borderColor: CHART_COLORS[i],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS[i],
          },
        },
        areaStyle: this.getChartSeriesAresStyle(CHART_COLORS[i]),
        data: array[i].points,
      };

      series.push(serie);
    }

    return series;
  }

  getPriceChartSeries() {
    let raw = this.poolRatesModule.price.chart.rawChart;
    let series = [];

    let poolName = this.selectedAsset;
    let filter = raw.filter(
      (pool) => new Asset(pool.asset.name).chainDotTicker == poolName
    );
    let BUSDfilter = raw.filter(
      (pool) => new Asset(pool.asset.name).chainDotTicker == 'BNB.BUSD'
    );

    if (filter.length > 0) {
      for (let y = 0; y < filter.length; y++) {
        let time = moment(filter[y].time).format('D/M/yyyy hh:mm a');
        let value: any;
        value =
          this.selectedAsset == 'BNB.BUSD'
            ? filter[y].value.toFixed(5)
            : (filter[y].value / BUSDfilter[y].value).toFixed(5);

        let element = [time, value];
        series.push(element);
      }
    }

    return {
      name: 'Asset Price',
      data: series,
      type: 'line',
      yAxisIndex: 0,
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

  getROIChartSeries() {
    let raw = this.poolRatesModule.roi.chart.rawChart;
    let series = [];

    let poolName = this.selectedAsset;
    let filter = raw.filter(
      (pool) => new Asset(pool.asset.name).chainDotTicker == poolName
    );
    if (filter.length > 0) {
      for (let y = 0; y < filter.length; y++) {
        let time = moment(filter[y].time).format('D/M/yyyy hh:mm a');
        let value: any;
        value = (filter[y].value * 100).toFixed(2);

        let element = [time, value];
        series.push(element);
      }
    }

    return {
      name: 'Pool APY',
      data: series,
      type: 'line',
      yAxisIndex: 1,
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

  getStakersChartSeries() {
    let raw = this.poolRatesModule.stakers.chart.rawChart;
    let series = [];

    let poolName = this.selectedAsset;
    let filter = raw.filter(
      (pool) => new Asset(pool.asset.name).chainDotTicker == poolName
    );
    if (filter.length > 0) {
      for (let y = 0; y < filter.length; y++) {
        let time = moment(filter[y].time).format('MM/DD/YYYY HH:[00]');
        let value: any;
        value = filter[y].value.toFixed(0);

        let element = [time, value];
        series.push(element);
      }
    }

    return {
      type: 'bar',
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

  processPoolratesTable(array) {
    let poolratesTable: PoolRatesTable[] = [];

    for (let i = 0; i < array.length; i++) {
      if (array[i].asset.status == 'enabled') {
        let findDot = array[i].asset.name.indexOf('.');
        let findDash = array[i].asset.name.indexOf('-');
        let getAssetName =
          findDash == -1
            ? array[i].asset.name.substr(findDot + 1)
            : array[i].asset.name.substr(findDot + 1, findDash - 4);
        let getIcon = array[i].asset.name.substr(findDot + 1);

        let poolrate: PoolRatesTable = {
          asset: getAssetName,
          price: array[i].price,
          depth: array[i].depth,
          volume: array[i].volume,
          swaps: array[i].swaps,
          roi: array[i].roi,
          stakers: array[i].stakers,
          staked: array[i].staked,
          slip: array[i].slipfee,
        };

        poolratesTable.push(poolrate);
      }
    }

    return this.orderTableByROIDesc(poolratesTable);
  }

  orderTableByROIDesc(poolratesTable: PoolRatesTable[]) {
    return Array.from(poolratesTable).sort((a: any, b: any) => {
      if (a['roi'] > b['roi']) {
        return -1;
      } else if (a['roi'] < b['roi']) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  orderTableByFieldDesc(poolratesTable: PoolRatesTable[], field: string) {
    return Array.from(poolratesTable).sort((a: any, b: any) => {
      if (a[field] > b[field]) {
        return -1;
      } else if (a[field] < b[field]) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  onChange($event) {
    if ($event == undefined) {
      $event = this.poolratesTable[0];
    }
    this.assetLastPrice = $event.price;
    this.assetVolume = $event.volume;
    this.assetROI = $event.roi;
    this.selectedAsset = $event.asset.chainDotTicker;
    this.setLastSectionOptions();
  }

  setLastSectionOptions() {
    this.assetPriceOptions = {
      tooltip: {
        trigger: 'axis', //'axis' para ver todas las intercepciones juntas en el tooltip
        axisPointer: {
          type: 'cross',
          label: {
            fontFamily: 'Inner Lato',
            backgroundColor: 'rgba(32,168,216,0.7)',
          },
        },
        textStyle: {
          fontFamily: 'Inner Lato',
        },
        backgroundColor: 'rgba(32,168,216,0.7)',
      },
      legend: {
        icon: 'roundRect',
        data: ['Asset Price', 'Pool APY'],
        align: 'right',
        width: '100%',
        textStyle: {
          fontFamily: 'Inner Lato',
          color: this.chartTheme,
        },
      },
      /*dataZoom: [
        {
          type: 'inside',
          realtime: true,
          start: 0,
          end: 100,
        },
      ],*/
      xAxis: [
        {
          type: 'category',
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: 'Asset Price (' + this.getRuneSimbol() + ')',
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
          name: 'Pool APY(%)',
          nameLocation: 'end',
          type: 'value',
          nameTextStyle: {
            fontFamily: 'Inner Lato',
            color: '#BE29E2',
            fontWeight: 'bold',
            fontSize: 16,
            align: 'right',
          },
          axisLine: {
            lineStyle: {
              onZero: false,
              color: this.chartTheme,
            },
          },
        },
      ],
      toolbox: {
        show: true,
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
      series: [this.getPriceChartSeries(), this.getROIChartSeries()],
    };

    this.assetStakersOptions = {
      tooltip: {
        trigger: 'item', //'axis' para ver todas las intercepciones juntas en el tooltip
        axisPointer: {
          type: 'cross',
          label: {
            fontFamily: 'Inner Lato',
            backgroundColor: 'rgba(32,168,216,0.7)',
          },
        },
        textStyle: {
          fontFamily: 'Inner Lato',
        },
        backgroundColor: 'rgba(32,168,216,0.7)',
      },
      legend: {},
      toolbox: {
        show: true,
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
      grid: {},
      xAxis: [
        {
          type: 'category',
          axisLine: {
            lineStyle: {
              color: this.chartTheme,
            },
          },
        },
      ],
      yAxis: {
        name: 'Stakers',
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
      series: [this.getStakersChartSeries()],
    };
  }

  tdColor() {
    if (localStorage.getItem('dcf-theme') == 'light-theme') {
      return 'td-stiky-ligth';
    } else {
      return 'td-stiky-dark';
    }
  }

  thColor() {
    if (localStorage.getItem('dcf-theme') == 'light-theme') {
      return 'th-stiky-ligth';
    } else {
      return 'th-stiky-dark';
    }
  }

  getRuneSimbol() {
    if (this.currency == 0) {
      return 'ᚱ';
    } else {
      return '$';
    }
  }

  onChartInit(ec) {
    this.echartsIntance = ec;
  }

  resizeChart() {
    if (this.echartsIntance) {
      this.echartsIntance.resize();
    }
  }
}
