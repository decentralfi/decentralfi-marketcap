import { Component, OnInit, HostListener } from '@angular/core';
import { Network } from '../shared/interfaces/network';
import { GlobalCurrencyService } from '../shared/services/global-currency.service';
import { GlobalTimePeriodService } from '../shared/services/global-time-period.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { LoaderService } from '../shared/services/loader.service';
import { NetworkService } from '../shared/services/network.service';
import { NetworkChainService } from '../shared/services/network-chain.service';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { consoleLog } from 'src/app/utils/consoles';
import * as moment from 'moment';
import { graphic } from 'echarts';

const moduleFields: any[] = [
  { field: 'totalcapital', label: 'Total Pool Deposited', type: 'currency' },
  { field: 'totalactivebond', label: 'Total Stakers', type: 'integer' },
  { field: 'totalstandbybond', label: 'Average ROI', type: 'percentage' },
  { field: 'totalreserve', label: 'Total Pool Deposited', type: 'currency' },
  { field: 'totalstaked', label: 'Total Stakers', type: 'integer' },
  { field: 'totalactivenode', label: 'Average ROI', type: 'percentage' },
  { field: 'totalstakers', label: 'Total Pool Deposited', type: 'currency' },
  { field: 'totalactiveusers', label: 'Total Stakers', type: 'integer' },
  { field: 'totalblockreward', label: 'Average ROI', type: 'percentage' },
  { field: 'totalblockheight', label: 'Average ROI', type: 'percentage' },
];

const CHART_COLOR = '#20a8d8';

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
})
export class NetworkComponent implements OnInit {
  public echartsIntance: any;

  faQuestionCircle = faQuestionCircle;
  public img: string;
  public lastUpdatedLabel = moment().format('MM/DD/YYYY HH:[00]');
  public lastUpdatedFlag: boolean = false;
  public valueLabel: string = 'Total Capital';
  public selectedParam: string = 'totalcapital';
  public networkModule: Network;
  public initFlag: number = 0;
  public executeFlag: number = 0;
  public currency: number = 0;
  public loaderCounter: number = 0;
  /**LOADER ALIVE COUNTER */
  public loaderCounterLimit: number = 10;
  public perdiodRangeLabel: string = 'last24hr';
  public perdiodRangeValue: string = '24H';
  public options: any;
  public runeSupplyOptions: any;
  public chartTheme: string;
  public isLoading = false;
  public innerWidth: any;
  public mobileFlag: boolean = false;
  public duration: moment.Duration;
  public incentiveBonded: number = 67;
  public incentiveStaked: number = 33;
  public incentiveStatus: number = 3;
  public incentiveStatusClass: string = 'status-card optimal';
  public resultClass: string = 'result optimal';
  public systemStatus: string = 'Optimal';
  public rewardChanges: string = 'None';

  public incentivePendulum = [
    {
      status: 'Inefficient',
      class: 'inefficient',
      short: 'Further decrase node rewards',
      desc: 'Further decrase node rewards and further increase liquidity rewards',
    },
    {
      status: 'Over-Bonded',
      class: 'overbonded',
      short: 'Decrase node rewards',
      desc: 'Decrease node rewards and increase liquidity rewards',
    },
    { status: 'Optimal', class: 'optimal', short: 'None', desc: 'None' },
    {
      status: 'Under-Bonded',
      class: 'underbonded',
      short: 'Increase node rewards',
      desc: 'Increase node rewards and decrease liquidity rewards',
    },
    {
      status: 'UnSafe',
      class: 'unsafe',
      short: 'Further increase node rewards',
      desc: 'Further increase node rewards and further decrease liquidity rewards',
    },
  ];

  public networkValue = 'multichain_chaosnet';

  @HostListener('window:resize', ['$event']) onResize(event) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.mobileFlag = false;
      this.setOptions();
    }
    if (this.innerWidth <= 960) {
      this.mobileFlag = true;
      this.setOptions();
    }
  }

  constructor(
    private loaderService: LoaderService,
    private chartThemeService: GlobalChartsThemeService,
    private currencyService: GlobalCurrencyService,
    private timePeriodService: GlobalTimePeriodService,
    public roundedPipe: RoundedValuePipe,
    public networkService: NetworkService,
    private networkChainService: NetworkChainService
  ) {}

  ngOnInit() {
    this.networkModule = {
      totalcapital: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalactivebond: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalstandbybond: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalreserve: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalstaked: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalactivenode: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalstakers: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalactiveusers: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalblockreward: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
      totalblockheight: {
        total: 0,
        tooltip: '',
        chart: {
          assetPoints: [],
        },
      },
    };

    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.mobileFlag = false;
      this.setOptions();
    }
    if (this.innerWidth <= 960) {
      this.mobileFlag = true;
      this.setOptions();
    }

    this.chartThemeService.getGlobalChartTheme().subscribe((theme) => {
      if (theme == 'light-theme') {
        this.chartTheme = '#808080';
      } else {
        this.chartTheme = '#ececec';
      }
      this.setOptions();
    });

    this.chartThemeService.getToggleSidebar().subscribe((toggle) => {
      if (toggle == true) {
        setTimeout(() => {
          this.echartsIntance.resize();
        }, 300);
      }
    });

    this.perdiodRangeLabel = this.timePeriodService.getGlobalTimePeriodValue();
    //this.currency = this.currencyService.getGlobalCurrencyValue();

    this.currencyService.getGlobalCurrency().subscribe((currency) => {
      let price = currency.price;
      if (currency.label == 'RUNE') {
        price = 1;
      }

      const fields: string[] = [
        'totalcapital',
        'totalactivebond',
        'totalstandbybond',
        'totalreserve',
        'totalblockreward',
      ];

      this.networkService
        .getOriginalNetwork()
        .subscribe((originalNetwork: Network) => {
          if (originalNetwork != null && this.networkModule) {
            let networkModule = {};
            for (let i = 0; i < moduleFields.length; i++) {
              let filter = fields.filter(
                (field) => field == moduleFields[i].field
              );
              if (filter.length > 0) {
                let total =
                  originalNetwork[moduleFields[i].field].total / price;
                let tooltip = originalNetwork[moduleFields[i].field].tooltip;
                let chart = { assetPoints: [] };

                for (
                  let y = 0;
                  y <
                  originalNetwork[moduleFields[i].field].chart.assetPoints
                    .length;
                  y++
                ) {
                  let time =
                    originalNetwork[moduleFields[i].field].chart.assetPoints[
                      y
                    ][0];
                  let value =
                    originalNetwork[moduleFields[i].field].chart.assetPoints[
                      y
                    ][1] / price;

                  let item = [time, value];
                  chart.assetPoints.push(item);
                }

                let network = {
                  total: total,
                  tooltip: tooltip,
                  chart: chart,
                };

                networkModule[moduleFields[i].field] = network;
              } else {
                networkModule[moduleFields[i].field] =
                  originalNetwork[moduleFields[i].field];
              }
            }
            this.networkModule = networkModule;
            this.setOptions();
          }
        });
    });

    /* Here is where we subscribe to global time period */
    this.timePeriodService.getGlobalTimePeriod().subscribe((period) => {
      this.loaderService.loaderShow(this.loaderCounterLimit);

      this.perdiodRangeLabel = period;

      this.getMiniCardClass('totalcapital');
      this.paramSelect('totalcapital', 'Total Capital');

      this.executeQuery();
    });
    /* */

    /* Here is where we subscribe to global networkchain */
    this.networkChainService.getGlobalNetwork().subscribe((network) => {
      this.loaderService.loaderShow(this.loaderCounterLimit);

      this.networkValue = network;

      this.getMiniCardClass('totalcapital');
      this.paramSelect('totalcapital', 'Total Capital');

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
    consoleLog('baseHour: ' + baseHour);
    consoleLog('actualHour: ' + actualHour.format('MM/DD/YYYY HH:mm'));
    consoleLog('nextHour: ' + nextHour.format('MM/DD/YYYY HH:mm'));
    consoleLog(this.duration.asMilliseconds());

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
      this.networkService
        .getHistory(
          moduleFields[i].field,
          this.perdiodRangeLabel,
          this.networkValue,
          this.currency
        )
        .subscribe((data: Network) => {
          this.networkModule[moduleFields[i].field] = data;
          consoleLog(moduleFields[i].field);
          this.setHideLoader();
        });
    }

    /** INCENTIVE PENDULUM */
    /*this.networkService.getIncentivePendulum().subscribe((data:NetworkPendulum) => {
      this.incentiveBonded = data.totalActiveBond;
      this.incentiveStaked = data.totalStaked;
      this.incentiveStatus = +(100 * (1/(((this.incentiveBonded / 100000000) + (this.incentiveStaked / 100000000)) / ((this.incentiveBonded / 100000000) - (this.incentiveStaked / 100000000))))).toFixed(0);
      this.getIncentivePendulum();
      this.setHideLoader();
    });*/
  }

  getIncentivePendulum() {
    if (this.incentiveStatus >= 0 && this.incentiveStatus <= 18) {
      consoleLog(this.incentivePendulum[0].status);
      this.systemStatus = this.incentivePendulum[0].status;
      this.rewardChanges = this.incentivePendulum[0].short;
      this.incentiveStatusClass =
        'status-card ' + this.incentivePendulum[0].class;
      this.resultClass = 'result ' + this.incentivePendulum[0].class;
    } else if (this.incentiveStatus >= 19 && this.incentiveStatus <= 24) {
      consoleLog(this.incentivePendulum[1].status);
      this.systemStatus = this.incentivePendulum[1].status;
      this.rewardChanges = this.incentivePendulum[1].short;
      this.incentiveStatusClass =
        'status-card ' + this.incentivePendulum[1].class;
      this.resultClass = 'result ' + this.incentivePendulum[1].class;
    } else if (this.incentiveStatus >= 25 && this.incentiveStatus <= 35) {
      consoleLog(this.incentivePendulum[2].status);
      this.systemStatus = this.incentivePendulum[2].status;
      this.rewardChanges = this.incentivePendulum[2].short;
      this.incentiveStatusClass =
        'status-card ' + this.incentivePendulum[2].class;
      this.resultClass = 'result ' + this.incentivePendulum[2].class;
    } else if (this.incentiveStatus >= 36 && this.incentiveStatus <= 41) {
      consoleLog(this.incentivePendulum[3].status);
      this.systemStatus = this.incentivePendulum[3].status;
      this.rewardChanges = this.incentivePendulum[3].short;
      this.incentiveStatusClass =
        'status-card ' + this.incentivePendulum[3].class;
      this.resultClass = 'result ' + this.incentivePendulum[3].class;
    } else if (this.incentiveStatus >= 42) {
      consoleLog(this.incentivePendulum[4].status);
      this.systemStatus = this.incentivePendulum[4].status;
      this.rewardChanges = this.incentivePendulum[4].short;
      this.incentiveStatusClass =
        'status-card ' + this.incentivePendulum[4].class;
      this.resultClass = 'result ' + this.incentivePendulum[4].class;
    }
  }

  processDataChart(array, label?: string) {
    let outputArray: any[] = [];
    let value: any;

    for (let i = 0; i < array.length; i++) {
      if (
        label == 'totalactivenode' ||
        label == 'totalstakers' ||
        label == 'totalactiveusers' ||
        label == 'totalblockheight'
      ) {
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

      if (value) {
        outputArray.push(value);
      }
    }

    if (this.lastUpdatedFlag == false) {
      let arrayLen = array.length;
      this.lastUpdatedLabel = moment(array[arrayLen - 1].time).format(
        'MM/DD/YYYY HH:[00]'
      );
      this.lastUpdatedFlag = true;
    }

    return outputArray;
  }

  setHideLoader() {
    this.loaderCounter++;
    consoleLog(this.loaderCounter + ' == ' + this.loaderCounterLimit);
    if (this.loaderCounter == this.loaderCounterLimit) {
      this.setOptions();

      setTimeout(() => {
        this.loaderService.loaderHide(this.loaderCounter);
        this.loaderCounter = 0;
        this.initFlag = 0;
        consoleLog(this.networkModule);
        this.networkService.setOriginalNetwork(this.networkModule);
      }, 1000);
    } else {
      this.loaderService.loaderHide(this.loaderCounter);
    }
  }

  paramSelect(param: string, label: string) {
    this.selectedParam = param;
    this.valueLabel = label;
    this.setOptions();
  }

  setOptions() {
    this.options = {
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
        },
        backgroundColor: 'rgba(32,168,216,0.7)',
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

    let left = '65%';
    let top = 'center';
    let center = ['30%', '50%'];
    let titleTop = 'center';
    let titleLeft = '18%';
    let titleText = '    67%';
    if (this.mobileFlag == true) {
      left = 'center';
      top = '60%';
      center = ['50%', '30%'];
      titleTop = '18%';
      titleLeft = 'center';
      titleText = ' 67%';
    }

    this.runeSupplyOptions = {
      title: {
        text: titleText,
        subtext: 'Total supply in use',
        left: titleLeft,
        top: titleTop,
        textStyle: {
          fontSize: 50,
          fontFamily: 'Inner Lato',
          color: 'rgba(31, 120, 180, 1)',
        },
        subtextStyle: {
          fontSize: 20,
          fontFamily: 'Inner Lato',
          color: this.chartTheme,
        },
      },
      tooltip: {
        formatter: '{b}',
        trigger: 'item',
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
      legend: {
        icon: 'circle',
        orient: 'vertical',
        left: left,
        top: top,
        itemGap: 25,
        textStyle: {
          fontFamily: 'Inner Lato',
          fontSize: 18,
          color: this.chartTheme,
        },
        data: [
          'Liquidity provider (15.31%)',
          'Active nodes (43.88%)',
          'Standby nodes (7.14%)',
          'Standby pools (0.00%)',
          'Outside of network (33.67%)',
        ],
      },
      series: [
        {
          name: 'SERIE',
          type: 'pie',
          radius: ['55%', '70%'],
          center: center,
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: false,
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            {
              value: 15,
              name: 'Liquidity provider (15.31%)',
              itemStyle: {
                color: 'rgba(178, 223, 138, 1)',
              },
            },
            {
              value: 43,
              name: 'Active nodes (43.88%)',
              itemStyle: {
                color: 'rgba(31, 120, 180, 1)',
              },
            },
            {
              value: 7,
              name: 'Standby nodes (7.14%)',
              itemStyle: {
                color: 'rgba(51, 160, 44, 1)',
              },
            },
            {
              value: 0,
              name: 'Standby pools (0.00%)',
              itemStyle: {
                color: 'rgba(118, 118, 118, 1)',
              },
            },
            {
              value: 33,
              name: 'Outside of network (33.67%)',
              itemStyle: {
                color: 'rgba(166, 206, 227, 1)',
              },
            },
          ],
        },
      ],
    };
  }

  getYAxisDataName() {
    return this.valueLabel;
  }

  getChartSeries() {
    let array: any[] = this.networkModule[this.selectedParam].chart.assetPoints;

    let serie = {
      type: 'line',
      itemStyle: {
        normal: {
          color: CHART_COLOR,
          borderColor: CHART_COLOR,
          opacity: 1,
        },
        emphasis: {
          color: '#ffffff',
          borderColor: CHART_COLOR,
          borderWidth: 2,
          opacity: 1,
        },
      },
      lineStyle: {
        normal: {
          color: CHART_COLOR,
        },
      },
      areaStyle: this.getChartSeriesAresStyle(CHART_COLOR),
      data: array,
    };

    return serie;
  }

  getChartSeriesAresStyle(color) {
    if (this.selectedParam != 'swapSize' && this.selectedParam != 'swapFee') {
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

  getMiniCardClass(param) {
    if (param == this.selectedParam) {
      return 'mini-card-selected';
    } else {
      return 'mini-card';
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
