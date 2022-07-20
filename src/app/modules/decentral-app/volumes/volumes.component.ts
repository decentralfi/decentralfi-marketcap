import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { graphic } from 'echarts';
import { LoaderService } from '../shared/services/loader.service';
import { GlobalCurrencyService } from '../shared/services/global-currency.service';
import { GlobalTimePeriodService } from '../shared/services/global-time-period.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { NetworkChainService } from '../shared/services/network-chain.service';
import { VolumesService } from '../shared/services/volumes.service';
import {
  Volumes,
  Table,
  AssetPoints,
  Totals,
  Chart,
} from '../shared/interfaces/volumes';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';
import * as moment from 'moment';
import { consoleLog } from '@app/utils/consoles';

const moduleFields: any[] = [
  { field: 'volume', label: 'Total Pool Deposited', type: 'currency' },
  { field: 'depth', label: 'Total Stakers', type: 'integer' },
  { field: 'swaps', label: 'Average ROI', type: 'percentage' },
  { field: 'buyvolume', label: 'Total Pool Deposited', type: 'currency' },
  { field: 'sellvolume', label: 'Total Stakers', type: 'integer' },
  { field: 'avgswapsize', label: 'Average ROI', type: 'percentage' },
  { field: 'slipaverage', label: 'Total Pool Deposited', type: 'currency' },
];

const ELEMENT_DATA: Table[] = [
  {
    rank: 1,
    asset: {
      fullname: 'THOR.THOR',
      nameChain: 'THOR.THOR',
      chain: 'THOR',
      symbol: 'THOR',
      ticker: 'THOR',
      iconPath: 'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png',
    },
    value: 0,
  },
];
const CHART_COLORS = [
  '#FFEC3A',
  '#8CC34A',
  '#2096F3',
  '#3F51B5',
  '#673AB7',
  '#9C27B0',
  '#E91E63',
  '#f34436',
  '#22dbbf',
  '#00edc9',
];

@Component({
  selector: 'app-volumes',
  templateUrl: './volumes.component.html',
  styleUrls: ['./volumes.component.scss'],
})
export class VolumesComponent implements OnInit {
  public echartsIntance: any;

  faQuestionCircle = faQuestionCircle;
  displayedColumns: string[] = ['rank', 'asset', 'value'];
  public dataSource = new MatTableDataSource(ELEMENT_DATA);
  public lastUpdatedLabel = moment().format('MM/DD/YYYY HH:[00]');
  public lastUpdatedFlag: boolean = false;
  public valueLabel: string = 'Volumes';
  public selectedParam: string = 'volumes';
  public perdiodRangeLabel: string = 'last24hr';
  public perdiodRangeValue: string = '24H';
  public currency: number = 0;

  public loaderCounter: number = 0;
  public loaderCounterLimit: number = 21;

  public totalVolumes: number;

  public volumesModule: Volumes;

  public chartTheme: string;
  public chartThemePaginator: string;

  options: any;

  public networkValue = 'multichain_chaosnet';

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public initFlag: number = 0;
  public executeFlag: number = 0;
  public duration: moment.Duration;

  constructor(
    private loaderService: LoaderService,
    private currencyService: GlobalCurrencyService,
    private timePeriodService: GlobalTimePeriodService,
    private chartThemeService: GlobalChartsThemeService,
    private volumesService: VolumesService,
    public roundedPipe: RoundedValuePipe,
    private networkChainService: NetworkChainService
  ) {}

  ngOnInit() {
    /* Master object to handle module's data */

    this.volumesModule = {
      volume: {
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
      depth: {
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
      swaps: {
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
      buyvolume: {
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
      sellvolume: {
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
      avgswapsize: {
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
      slipaverage: {
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

      this.volumesService.getOriginalVolumesModule().subscribe((volumes) => {
        if (volumes != null) {
          let volumesModule = {};
          for (let i = 0; i < moduleFields.length; i++) {
            if (
              moduleFields[i].field != 'swaps' &&
              moduleFields[i].field != 'slipaverage'
            ) {
              let total = +volumes[moduleFields[i].field].total / price;
              let table = [];
              let chart = {};
              let labels = [];
              let assetPoints = [];

              for (
                let x = 0;
                x < volumes[moduleFields[i].field].table.length;
                x++
              ) {
                let value =
                  +volumes[moduleFields[i].field].table[x].value / price;

                let row = {
                  rank: volumes[moduleFields[i].field].table[x].rank,
                  asset: volumes[moduleFields[i].field].table[x].asset,
                  value: value,
                };

                table.push(row);
              }

              let assetPoint = {};
              for (
                let x = 0;
                x < volumes[moduleFields[i].field].chart.assetPoints.length;
                x++
              ) {
                let points = [];
                for (
                  let y = 0;
                  y <
                  volumes[moduleFields[i].field].chart.assetPoints[x].points
                    .length;
                  y++
                ) {
                  let value = [
                    volumes[moduleFields[i].field].chart.assetPoints[x].points[
                      y
                    ][0],
                    (
                      +volumes[moduleFields[i].field].chart.assetPoints[x]
                        .points[y][1] / price
                    ).toFixed(2),
                  ];
                  points.push(value);
                }
                assetPoint = {
                  asset:
                    volumes[moduleFields[i].field].chart.assetPoints[x].asset,
                  points: points,
                };
                assetPoints.push(assetPoint);
              }

              labels = volumes[moduleFields[i].field].chart.labels;
              chart = {
                labels: labels,
                assetPoints: assetPoints,
              };

              let volume = {
                chart: chart,
                table: table,
                tooltip: volumes[moduleFields[i].field].tooltip,
                total: total,
              };
              volumesModule[moduleFields[i].field] = volume;
            } else {
              volumesModule[moduleFields[i].field] =
                volumes[moduleFields[i].field];
            }
          }

          this.volumesModule = volumesModule;

          this.dataSource = new MatTableDataSource(
            this.volumesModule[this.selectedParam].table
          );
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;

          this.setOptions();
        }
      });
    });

    /* Here is where we subscribe to global time period */
    this.timePeriodService.getGlobalTimePeriod().subscribe((period) => {
      this.loaderService.loaderShow(this.loaderCounterLimit);

      this.perdiodRangeLabel = period;

      this.getMiniCardClass('volume');
      this.paramSelect('volume', 'Volumes');

      this.executeQuery();
    });
    /* */

    /* Here is where we subscribe to global networkchain */
    this.networkChainService.getGlobalNetwork().subscribe((network) => {
      this.loaderService.loaderShow(this.loaderCounterLimit);

      this.networkValue = network;

      this.getMiniCardClass('volume');
      this.paramSelect('volume', 'Volumes');

      this.executeQuery();
    });

    this.automaticQuery();
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

    /**HISTORY */
    for (let i = 0; i < moduleFields.length; i++) {
      this.volumesService
        .getHistory(
          moduleFields[i].field,
          this.perdiodRangeLabel,
          this.networkValue
        )
        .subscribe((data) => {
          this.volumesModule[moduleFields[i].field].chart = data;
          consoleLog('chart');
          this.setHideLoader();
        });
    }

    /**TOTALS */
    this.volumesService
      .getTotals(this.perdiodRangeLabel, this.networkValue)
      .subscribe((totals: Totals) => {
        for (let i = 0; i < moduleFields.length; i++) {
          this.volumesModule[moduleFields[i].field].total =
            totals[moduleFields[i].field];
          this.volumesModule[moduleFields[i].field].tooltip =
            totals['tooltip_' + moduleFields[i].field];
          consoleLog('totals');
          this.setHideLoader();
        }
      });

    this.volumesService
      .getVolumesTable(this.perdiodRangeLabel, this.networkValue)
      .subscribe((data) => {
        for (let i = 0; i < moduleFields.length; i++) {
          let ordered = this.orderTableByFieldDesc(
            data[moduleFields[i].field],
            'value'
          );
          for (let i = 0; i < ordered.length; i++) {
            let rank = i + 1;
            ordered[i].rank = rank;
          }
          this.volumesModule[moduleFields[i].field].table = ordered;
          consoleLog('tables');
          this.setHideLoader();
          if (moduleFields[i].field == this.selectedParam) {
            this.dataSource = new MatTableDataSource(
              this.volumesModule[this.selectedParam].table
            );
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
          }
        }
      });
  }

  orderTableByFieldDesc(volumesTable: Table[], field: string) {
    return Array.from(volumesTable).sort((a: any, b: any) => {
      if (a[field] > b[field]) {
        return -1;
      } else if (a[field] < b[field]) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  proccesDataByPool(field: string, data: any[]) {
    let orderedArray: any = this.orderDataAscbyValue(data);
    let outputArray: Array<any> = [];
    let arrayLenght: number = data.length;
    let chartArray: AssetPoints[] = [];
    let chartLabelArray: string[] = [];
    let poolIndex = 0;

    for (let i = 0; i < arrayLenght; i++) {
      if (orderedArray[i].asset.status == 'enabled') {
        poolIndex = poolIndex + 1;

        let asset = orderedArray[i].asset.name;
        let findDot = asset.indexOf('.');
        let findDash = asset.indexOf('-');
        let getAssetName =
          findDash == -1
            ? asset.substr(findDot + 1)
            : asset.substr(findDot + 1, findDash - 4);
        asset = getAssetName;

        let value = orderedArray[i].total_pool;
        let rank = poolIndex;
        let row = { rank, asset, value };

        outputArray.push(row);
        chartArray.push(
          this.processDataChart(field, orderedArray[i].pool, getAssetName)
        );
        chartLabelArray.push(getAssetName);
      }
    }

    this.volumesModule[field].chart.assetPoints = chartArray;
    this.volumesModule[field].chart.labels = chartLabelArray;

    this.volumesModule[field].table = outputArray;

    if (field == 'volume') {
      this.dataSource = new MatTableDataSource(this.volumesModule[field].table);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }

  searchAsset(table, asset) {
    for (let i = 0; i < table.length; i++) {
      let findDot = asset.indexOf('.');
      let findDash = asset.indexOf('-');
      let getAssetName =
        findDash == -1
          ? asset.substr(findDot + 1)
          : asset.substr(findDot + 1, findDash - 4);
      if (table[i].asset == getAssetName) {
        return true;
      }
    }
  }

  getYAxisDataName() {
    return this.valueLabel;
  }

  getSeriesStep() {
    if (
      this.selectedParam == 'avgswapsize' ||
      this.selectedParam == 'slipaverage'
    ) {
      return 'start';
    } else {
      return false;
    }
  }

  getSeriesStack() {
    if (
      this.selectedParam != 'avgswapsize' &&
      this.selectedParam != 'slipaverage'
    ) {
      return 'counts';
    } else {
      return false;
    }
  }

  getChartSeriesAresStyle(color) {
    if (
      this.selectedParam != 'avgswapsize' &&
      this.selectedParam != 'slipaverage'
    ) {
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
    let array: any[] = this.dataSource._pageData(
      this.volumesModule[this.selectedParam].chart.assetPoints
    );

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

  getChartLegend() {
    let array = this.dataSource._pageData(
      this.volumesModule[this.selectedParam].chart.labels
    );
    let newArray = [];
    for (let i = 0; i < array.length; i++) {
      newArray.push(array[i]);
    }
    return newArray;
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

  processDataTable(array, label: string) {
    let orderedArray: any = this.orderDataAscbyValue(array);
    let outputArray: Array<any> = [];
    let arrayLenght: number = array.length >= 10 ? 10 : array.length;
    //for (let i = 0; i < arrayLenght; i++) {
    for (let i = 0; i < array.length; i++) {
      let asset = orderedArray[i].asset.name;
      let findDot = asset.indexOf('.');
      let findDash = asset.indexOf('-');
      let getAssetName =
        findDash == -1
          ? asset.substr(findDot + 1)
          : asset.substr(findDot + 1, findDash - 4);
      asset = getAssetName;
      let value = orderedArray[i].value;
      let rank = i + 1;
      let row = { rank, asset, value };

      outputArray.push(row);
    }
    return outputArray;
  }

  processDataChart(field, array, asset) {
    let chart: AssetPoints;
    let value: any;

    chart = {
      asset: asset,
      points: [],
    };

    for (let i = 0; i < array.length; i++) {
      if (field == 'slipaverage') {
        let arrayValue = array[i].value * 100;
        if (this.networkValue == 'multichain_chaosnet') {
          arrayValue = array[i].value;
        }
        value = [
          moment(array[i].time).format('MM/DD/YYYY HH:[00]'),
          arrayValue.toFixed(2),
        ];
      } else if (field == 'swaps') {
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

  processDataChartLabels(array) {
    let labels = [];
    for (let i = 0; i < array.length; i++) {
      labels.push(array[i].asset);
    }

    return labels;
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

  pageEvent() {
    this.setOptions();
  }

  paramSelect(param: string, label: string) {
    this.selectedParam = param;
    this.valueLabel = label;
    this.dataSource = new MatTableDataSource(
      this.volumesModule[this.selectedParam].table
    );
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.firstPage();

    this.setOptions();
  }

  getMiniCardClass(param) {
    if (param == this.selectedParam) {
      return 'mini-card-selected';
    } else {
      return 'mini-card';
    }
  }

  setHideLoader() {
    this.loaderCounter++;
    consoleLog(this.loaderCounter + ' == ' + this.loaderCounterLimit);
    if (this.loaderCounter == this.loaderCounterLimit) {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.orderCharts();
      this.setOptions();
      this.volumesService.setOriginalVolumesModule(this.volumesModule);

      setTimeout(() => {
        this.loaderService.loaderHide(this.loaderCounter);
        this.loaderCounter = 0;
        this.initFlag = 0;
        consoleLog(this.volumesModule);
      }, 2000);
    } else {
      this.loaderService.loaderHide(this.loaderCounter);
    }
  }

  orderCharts() {
    for (let i = 0; i < moduleFields.length; i++) {
      let labels: string[] = [];
      let chart: Chart;
      for (
        let x = 0;
        x < this.volumesModule[moduleFields[i].field].table.length;
        x++
      ) {
        labels.push(
          this.volumesModule[moduleFields[i].field].table[x].asset.nameChain
        );
      }
      let assetPoints: AssetPoints[] = [];
      for (let z = 0; z < labels.length; z++) {
        let assetPointsFiltered =
          this.volumesModule[moduleFields[i].field].chart.assetPoints;
        let assetPointFiltered = assetPointsFiltered.filter(
          (pool) => pool.asset == labels[z]
        );

        if (assetPointFiltered[0] != undefined) {
          let assetPoint: AssetPoints = {
            asset: labels[z],
            points: assetPointFiltered[0].points,
          };
          assetPoints.push(assetPoint);
        }
      }

      chart = {
        labels: labels,
        assetPoints: assetPoints,
      };

      this.volumesModule[moduleFields[i].field].chart = chart;
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

  /** TODO: fix update chart when sorting */
  setOrder(sort) {
    this.setOptions();
  }

  isLoading = false;
}
