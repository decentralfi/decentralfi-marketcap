import {
  Component,
  OnInit,
  OnDestroy,
  HostBinding,
  HostListener,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

import { LoaderService } from '../shared/services/loader.service';
import { GlobalChartsThemeService } from 'src/app/services/global-charts-theme.service';
import { RoundedValuePipe } from '../shared/pipes/rounded-value.pipe';
import { DecimalPipe } from '@angular/common';

import { MatDialog } from '@angular/material/dialog';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

import { WalletBalanceService } from '../shared/services/wallet-balance.service';
import { MidgardService } from '../shared/services/midgard.service';

import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

import { AssetDetail } from '../shared/interfaces/models/assetDetail';
import { PoolDTO } from '../shared/interfaces/pool';
import { StakePoolSummary } from '../shared/interfaces/models/staker-pool/StakePoolSummary';
import { CoinIconsFromTrustWallet } from '../shared/constants/icon-list';
import {
  LPTotals,
  Resume,
  HistoryChartData,
} from '../shared/interfaces/liquidity';

import {
  WalletLiquidity,
  LiquidityPoolDisplay,
  LiquidityTrack,
  WalletData,
} from '../shared/interfaces/marketcap';

import BigNumber from 'bignumber.js';
import * as moment from 'moment';
import { graphic } from 'echarts';
import { AssetBalance } from '../shared/interfaces/asset-balance';

/* Master Wallet Manager */
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';
import { consoleLog } from '@app/utils/consoles';

import { TranslateService } from '@ngx-translate/core';

// this declare var to use plausible custom events
declare var plausible;

const CHART_COLORS_SCCN = ['#002e84', '#03E2D9', '#D4C65B'];

const CHART_COLORS_MCCN = [
  'rgba(178, 223, 138, 1)',
  'rgba(31, 120, 180, 1)',
  'rgba(51, 160, 44, 1)',
  'rgba(166, 206, 227, 1)',
  'rgba(118, 118, 118, 1)',
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
  '#002e84',
  '#03E2D9',
  '#D4C65B',
];

@Component({
  selector: 'app-liquidity',
  templateUrl: './liquidity.component.html',
  styleUrls: ['./liquidity.component.scss'],
})
export class LiquidityComponent implements OnInit, OnDestroy {
  public innerWidth: any;

  @HostBinding('class') componentCssClass: any;
  walletLiquidity: any;
  MCCNTrackingLiquidity: any;

  @HostListener('window:resize', ['$event']) onResize(event) {
    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.mobileFlag = false;
      this.tabletFlag = false;
    } else if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.tabletFlag = true;
      this.mobileFlag = false;
    } else if (this.innerWidth <= 450) {
      this.mobileFlag = true;
      this.tabletFlag = false;
    }
  }

  // Create a connector
  public connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  });

  public faQuestionCircle = faQuestionCircle;

  public themeValue: string = '';
  public isToggle: boolean;
  public logoFile: string;
  public dialogBackdropColorClass: string;
  public dialogPanelClass: string;
  public address: string = '';
  public currencyValue: string = 'BUSD';
  public currencyName: string = 'BUSD';
  public currencies = [
    { label: 'RUNE', value: 'RUNE' },
    { label: 'BUSD', value: 'BUSD' },
    { label: 'ASSET', value: 'ASSET' },
  ];
  public binanceExplorerUrl: string;
  public showData: boolean = false;
  public msgMCCN: string = 'Please connect to a wallet in order to view data.';
  public walletData: WalletData[];
  public bnbAccount: any;
  public addressMask: string;

  public stakerPools: string[];
  public balanceAssets: string[];
  public stakerPoolsDetails: PoolDTO;
  public originalStakeArray: StakePoolSummary[] = [];
  public stakerPoolsPrice: AssetDetail[];
  public walletBalancePrice: AssetDetail[];
  public walletBalance: AssetBalance[];
  public busdPrice = new BigNumber(0);
  public LPTotalsMCCN: LPTotals;
  public resumeMCCN: Resume = {
    totalWallet: new BigNumber(0),
    totalLPPerc: new BigNumber(0),
    apy: 0,
    apw: 0,
    apd: 0,
  };
  public pieOptionsMCCN: any;
  public mobileFlag: boolean = false;
  public tabletFlag: boolean = false;
  public chartTheme: string;
  public pieChartTheme: string;
  public historyChartDataMCCN: HistoryChartData[];
  public selectedAssetMCCN: string;
  public lineChartOptionsMCCN: any;
  public loaderCounter: number = 0;
  public loaderLimit: number = 3;
  public nonResumeFlag: boolean = false;
  public summaryMCCN: LiquidityPoolDisplay[];
  public currentNetwork: string = 'MCCN';
  public chartThemePaginator: string;

  public perdiodRangeValue: string = '24h';
  public perdiodRangeLabel: string = '24H';
  public periods = [
    { label: '24H', value: '24h', interval: 'hour', api: 'last24hr' },
    { label: '7D', value: '7d', interval: 'day', api: 'last7day' },
    { label: '1M', value: '30d', interval: 'day', api: 'lastMonth' },
    { label: '3M', value: '90d', interval: 'week', api: 'last3Month' },
    { label: '6M', value: '180d', interval: 'week', api: 'last6Month' },
    { label: '1Y', value: '365d', interval: 'week', api: 'lastYear' },
  ];

  public subs: Subscription[] = [];

  public showHideToggle: boolean = true;

  public translation: any;
  public language: string;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog,
    private loaderService: LoaderService,
    private chartThemeService: GlobalChartsThemeService,
    public walletBalanceService: WalletBalanceService,
    private midgardService: MidgardService,
    private roundedPipe: RoundedValuePipe,
    private decimalPipe: DecimalPipe,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    this.binanceExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org/'
        : 'https://explorer.binance.org/';

    this.componentCssClass = 'full';
  }

  ngOnInit() {
    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue == '' || this.themeValue == 'light-theme') {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = false;
      this.logoFile = 'DecentralFi-dark.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
      this.chartThemePaginator = '#20a8d8';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.isToggle = true;
      this.logoFile = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
      this.chartThemePaginator = '#ff9500';
    }

    this.innerWidth = window.innerWidth;
    if (this.innerWidth > 960) {
      this.mobileFlag = false;
      this.tabletFlag = false;
    } else if (this.innerWidth > 450 && this.innerWidth <= 960) {
      this.tabletFlag = true;
      this.mobileFlag = false;
    } else if (this.innerWidth <= 450) {
      this.mobileFlag = true;
      this.tabletFlag = false;
    }

    let gloabalthemeSub = this.chartThemeService
      .getGlobalChartTheme()
      .subscribe((theme) => {
        if (theme == 'light-theme') {
          this.chartTheme = '#ececec';
          this.pieChartTheme = '#808080';
          this.chartThemePaginator = '#20a8d8';
        } else {
          this.chartTheme = '#ececec';
          this.pieChartTheme = '#ececec';
          this.chartThemePaginator = '#ff9500';
        }
        this.setOptionsMCCN(this.resumeMCCN.totalLPPerc, this.resumeMCCN.pie);
      });

    //let LPwalletSub = this.masterWalletManagerService.LPwallet$.subscribe(
    let LPwalletSub = this.activeRoute.queryParams.subscribe((wallet) => {
      if (wallet != null && Object.entries(wallet).length !== 0) {
        this.nonResumeFlag = false;
        this.loaderService.loaderShow(this.loaderLimit);

        this.setWallet(wallet.wallet);
        this.nonResumeFlag = false;
        this.masterWalletManagerService.setWalleLiquidity(null);
        this.masterWalletManagerService.setMCCNTrackingLiquidity(null);
        this.masterWalletManagerService.setNONLPResume(null);
        this.masterWalletManagerService.setLPResume(null);
        this.resumeMCCN = {
          totalWallet: new BigNumber(0),
          totalLPPerc: new BigNumber(0),
          apy: 0,
          apw: 0,
          apd: 0,
        };
      } /*else {
          this.setWallet(this.activeRoute.snapshot.queryParams.wallet);
          this.masterWalletManagerService.setLPwallet(
            this.activeRoute.snapshot.queryParams.wallet
          );
        }*/
    });

    let globalnetworkSub = this.masterWalletManagerService
      .getGlobalNetwork()
      .subscribe((net) => {
        this.currentNetwork = net;
      });

    let currencySub = this.masterWalletManagerService.currency$.subscribe(
      (currency) => {
        if (currency !== null) {
          this.currencyName = currency;
          this.getMultichainLPData();
        }
      }
    );

    /*this.midgardService.summaryBUSDAmount$.subscribe((originalStake) => {
      if (originalStake != null) {
        this.originalStakeArray.push(originalStake);
        if (this.originalStakeArray.length == this.stakerPools.length) {
          this.midgardService
            .getPoolDetails(this.stakerPools)
            .subscribe((pools: PoolDTO) => {
              this.stakerPoolsDetails = pools;
              this.processStakerPoolsData(this.originalStakeArray, pools);
            });
        }
      }
    });*/

    let nonlpresumeSub = this.masterWalletManagerService.NONLPResume$.subscribe(
      (resume) => {
        if (resume != null) {
          this.msgMCCN = '';
          this.nonResumeFlag = true;
          this.resumeMCCN = resume;
          this.setOptionsMCCN(resume.totalLPPerc, resume.pie);
          this.loaderService.loaderHide(999);
        }
      }
    );

    let showhideSub = this.masterWalletManagerService.globalShowHide$.subscribe(
      (value) => {
        if (value != null) {
          this.showHideToggle = value;
          if (this.nonResumeFlag == true) {
            this.getNonLPResumeMCCN();
          } else {
            let shohideLPSub =
              this.masterWalletManagerService.walletLiquidity$.subscribe(
                (liquidity) => {
                  this.masterWalletManagerService.getResumeMCCN(
                    liquidity,
                    this.address,
                    this.currencyName,
                    this.showHideToggle
                  );
                }
              );
            this.subs.push(shohideLPSub);
          }
        }
      }
    );

    // this.masterWalletManagerService.getPools(this.currencyName).then((bum) => {
    //   consoleLog({ bum });
    // });

    this.subs.push(
      currencySub,
      showhideSub,
      nonlpresumeSub,
      globalnetworkSub,
      gloabalthemeSub,
      LPwalletSub
    );

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang;
      this.translate.use(lang);
      this.translate.get('liquidity').subscribe((res: string) => {
        this.translation = res;
        this.getMultichainLPData();
      });
    });
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }

    this.masterWalletManagerService.setWalleLiquidity(null);
    this.masterWalletManagerService.setMCCNTrackingLiquidity(null);
  }

  getMultichainLPData() {
    this.walletLiquidity =
      this.masterWalletManagerService.walletLiquidity$.subscribe(
        (originalliquidity) => {
          if (originalliquidity == null && this.address != '') {
            let getMultichainLPDataSub = this.masterWalletManagerService
              .getMultichainLPData(this.address)
              .subscribe(
                (liquidity) => {
                  if (!liquidity.details) {
                    this.msgMCCN = '';
                    if (
                      this.LPTotalsMCCN &&
                      this.nonResumeFlag == false &&
                      this.msgMCCN.length == 0
                    ) {
                      this.loaderService.loaderHide(999);
                    }
                  } else {
                    this.resumeMCCN = {
                      totalWallet: new BigNumber(0),
                      totalLPPerc: new BigNumber(0),
                      apy: 0,
                      apw: 0,
                      apd: 0,
                    };
                    this.msgMCCN = `Error fetching wallet data.`;
                    this.loaderService.loaderHide(999);
                  }
                },
                (error) => {
                  console.error(error);
                  this.getNonLPResumeMCCN();
                }
              );
            this.subs.push(getMultichainLPDataSub);
          } else if (originalliquidity != null) {
            this.processMCCNData(originalliquidity);
            this.getMCCNTrackingLiquidityMCCN();
          }
        }
      );
    this.subs.push(this.walletLiquidity);
  }

  getMCCNTrackingLiquidityMCCN() {
    this.MCCNTrackingLiquidity =
      this.masterWalletManagerService.MCCNTrackingLiquidity$.subscribe(
        (liquidityTrack) => {
          if (liquidityTrack != null) {
            this.processMCCNTrackingLiquidity(liquidityTrack);
          } else {
            let getMCCNTrackingLiquidity = this.masterWalletManagerService
              .getMCCNTrackingLiquidity(this.address, 'last24hr')
              .subscribe();
            this.subs.push(getMCCNTrackingLiquidity);
          }
        }
      );

    this.subs.push(this.MCCNTrackingLiquidity);
  }

  processMCCNTrackingLiquidity(liquidityTrack: LiquidityTrack) {
    let field = this.currencyName.toLocaleLowerCase();

    field == 'asset' ? (field = 'usd') : field;
    let simbol = '';
    field == 'rune' ? (simbol = 'ᚱ') : (simbol = '$');

    let assetPoints = [];
    let labels: string[] = [];
    let gainLoss = 0;
    for (let i = 0; i < liquidityTrack.liquidity.length; i++) {
      let assetName = this.getAssetName(liquidityTrack.liquidity[i].asset.name);
      gainLoss =
        gainLoss +
        liquidityTrack.liquidity[i].gain_loss_last_time['gain_loss_' + [field]];

      labels.push(assetName.chain + '.' + assetName.ticker);

      let points = [];
      for (let x = 0; x < liquidityTrack.liquidity[i].history.length; x++) {
        let value =
          liquidityTrack.liquidity[i].history[x].liquidity[field].toFixed(2);
        let time = moment(liquidityTrack.liquidity[i].history[x].time).format(
          'MM/DD/YYYY HH:[00]'
        );
        points.push([time, value]);
      }

      let x = Math.round(0xffffff * Math.random()).toString(16);
      let y = 6 - x.length;
      let z = '000000';
      let z1 = z.substring(0, y);
      let randomColor = '#' + z1 + x;

      let chartColor = '';

      if (i <= 12) {
        chartColor = CHART_COLORS_MCCN[i];
      } else {
        chartColor = randomColor.toUpperCase();
      }

      let serie = {
        name: assetName.chain + '.' + assetName.ticker,
        type: 'line',
        smooth: false,
        stack: 'counts', // only for totals
        itemStyle: {
          normal: {
            color: chartColor,
            borderColor: chartColor,
            opacity: 1,
          },
          emphasis: {
            color: '#ffffff',
            borderColor: chartColor,
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: chartColor,
          },
        },
        areaStyle: this.getChartSeriesAresStyle(chartColor),
        data: points,
      };

      assetPoints.push(serie);
    }
    this.lineChartOptionsMCCN = {
      title: {
        text: this.translation.graph.gain_loss + ': ' + this.roundedPipe.transform(gainLoss) + simbol,
        left: '70%',
        top: '5%',
        textStyle: {
          fontSize: 15,
          fontFamily: 'Inner Lato',
          color: '#20a8d8',
        },
        subtextStyle: {
          fontSize: 15,
          fontFamily: 'Inner Lato',
          color: this.pieChartTheme,
        },
      },
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
        backgroundColor: 'rgba(32,168,216,0.7)',
      },
      legend: {
        type: 'scroll',
        icon: 'roundRect',
        data: labels,
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
        },
      ],
      yAxis: [
        {
          type: 'value',
          name: this.translation.graph.liquidity + ' (' + simbol + ')',
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
      series: assetPoints,
    };
  }

  getChartSeriesAresStyle(color) {
    return {
      normal: {
        color: new graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color },
          { offset: 0.7, color: color },
          { offset: 1, color: 'rgba(255, 255, 255, 0.3)' },
        ]),
      },
    };
  }

  getResumeMCCN(liquidity: WalletLiquidity) {
    this.masterWalletManagerService.getResumeMCCN(
      liquidity,
      this.address,
      this.currencyName,
      this.showHideToggle
    );
    this.masterWalletManagerService.LPResume$.subscribe((resume) => {
      if (resume !== null) {
        if (this.nonResumeFlag == false) {
          this.resumeMCCN = resume;
          this.setOptionsMCCN(resume.totalLPPerc, resume.pie);
        }
      }
    });
  }

  processMCCNData(liquidity: WalletLiquidity) {
    let totalField = this.currencyName.toLocaleLowerCase();

    let summaryMCCN: LiquidityPoolDisplay[] = [];

    for (const pool in liquidity.pools) {
      let summary: LiquidityPoolDisplay = {
        current_liquidity: {
          asset: liquidity.pools[pool].current_liquidity.asset,
          rune: liquidity.pools[pool].current_liquidity.rune,
          total: liquidity.pools[pool].current_liquidity.total[totalField],
        },
        gain_loss: {
          asset: liquidity.pools[pool].gain_loss.asset,
          rune: liquidity.pools[pool].gain_loss.rune,
          total: liquidity.pools[pool].gain_loss.total[totalField],
        },
        gain_loss_percentage: {
          asset: liquidity.pools[pool].gain_loss_percentage.asset,
          rune: liquidity.pools[pool].gain_loss_percentage.rune,
          total: liquidity.pools[pool].gain_loss_percentage[totalField],
        },
        hodl: {
          asset: liquidity.pools[pool].hodl.asset,
          rune: liquidity.pools[pool].hodl.rune,
          total: liquidity.pools[pool].hodl[totalField],
        },
        liquidity_added: {
          asset: liquidity.pools[pool].liquidity_added.asset,
          rune: liquidity.pools[pool].liquidity_added.rune,
          total: liquidity.pools[pool].liquidity_added.total[totalField],
        },
        lp_days: liquidity.pools[pool].lp_days,
        withdraw: {
          asset: liquidity.pools[pool].withdraw.asset,
          rune: liquidity.pools[pool].withdraw.rune,
          total: liquidity.pools[pool].withdraw.total[totalField],
        },
        pool_name: liquidity.pools[pool].pool_name,
      };
      summaryMCCN.push(summary);
    }
    consoleLog({ summaryMCCN });
    this.summaryMCCN = summaryMCCN;

    /**TOTALS */

    totalField == 'asset' ? (totalField = 'usd') : totalField;

    let totals: LPTotals = {
      totalStaked: new BigNumber(
        liquidity.totals.added_liquidity[totalField] * 100000000
      ),
      totalCurrent: new BigNumber(
        liquidity.totals.current_liquidity[totalField] * 100000000
      ),
      totalWithdrawn: new BigNumber(
        liquidity.totals.withdraw[totalField] * 100000000
      ),
      totalGainLoss: liquidity.totals.current_gain_loss[totalField] * 100000000,
      totalGainLossPerc: liquidity.totals.gain_loss_percentage[totalField],
      apy: liquidity.totals.apy[totalField],
    };

    this.LPTotalsMCCN = totals;

    /////////////////////////////

    /** RESUME */
    if (this.nonResumeFlag == false) {
      this.getResumeMCCN(liquidity);
    }
    /** */
  }

  getNonLPResumeMCCN() {
    this.masterWalletManagerService.getNonLPResumeMCCN(
      this.currencyName,
      this.address,
      this.showHideToggle
    );
  }

  getStakerPoolsData() {
    for (let i = 0; i < this.stakerPools.length; i++) {
      this.midgardService
        .getOgirinalStake(this.address, this.stakerPools[i])
        .subscribe();
    }
  }

  getAssetName(asset: string) {
    let chain: string;
    let symbol: string;
    let ticker: string;
    let iconPath: string;

    const data = asset.split('.');

    if (asset.includes('.')) {
      chain = data[0];
      symbol = data[1];
    } else {
      symbol = data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }

    const trustWalletMatch = CoinIconsFromTrustWallet[ticker];

    if (trustWalletMatch) {
      iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
    } else {
      // Override token icons when not found in trustwallet
      switch (asset) {
        case 'BNB.BNB':
          iconPath =
            'https://app.thorswap.finance/static/media/asset-bnb.30ddcde6.svg';
          break;
        default:
          console.warn(
            `Icon not available for poolName ${asset}. Add override in src\\app\\_classes\\asset.ts`
          );
          iconPath = 'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png';
          break;
      }
    }

    return { chain, symbol, ticker, iconPath };
  }

  setTheme() {
    if (this.themeValue == 'light-theme') {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
      this.logoFile = 'DecentralFi-dark.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    } else {
      this.themeValue = 'light-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.chartThemeService.setGlobalChartTheme(this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
      this.logoFile = 'decentralfi-logo.svg';
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    }
  }

  walletDetails() {
    window.open(this.binanceExplorerUrl + 'address/' + this.address, '_blank');
  }

  setWallet(wallet: string) {
    this.address = wallet;
    let addressLenght = this.address.length;
    this.addressMask =
      this.address.slice(0, 8) +
      '....' +
      this.address.slice(addressLenght - 8, addressLenght);
  }

  getClass(number, isLpvsHodl?) {
    let className = 'content';
    if (number > 0) {
      className = className + ' green';
    } else if (number < 0) {
      className = className + ' red';
    }

    if (isLpvsHodl && isLpvsHodl == true) {
      className = className + ' lpHodl';
    }

    return className;
  }

  getClassProfit(percent: number) {
    if (percent >= 0) {
      return 'profit green';
    } else {
      return 'profit red';
      //return percent.indexOf('-') ? 'profit green' : 'profit red';
    }
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

  getRowClass() {
    //if (!this.summaryMCCN) {
    return 'decentral-row';
    //}
  }

  setOptionsMCCN(totalLPPerc, dataSeries?) {
    if (!dataSeries) {
      dataSeries = [
        {
          value: 100,
          name: 'RUNE (100%) 100' + this.getSimbol(),
          itemStyle: {
            color: 'rgba(178, 223, 138, 1)',
          },
        },
      ];
    }

    let left = '45%';
    let top = 'center';
    let center = ['22%', '50%'];
    let titleTop = '40%';
    let titleLeft = '15%';
    let titleText = totalLPPerc.toFixed(2) + '%';
    let toolboxOrient = 'vertical';
    if (this.mobileFlag == true) {
      left = 'center';
      top = '55%';
      center = ['50%', '30%'];
      titleTop = '22%';
      titleLeft = 'center';
      titleText = ' ' + totalLPPerc.toFixed(2) + '%';
      toolboxOrient = 'horizontal';
    } else if (this.tabletFlag == true) {
      left = 'center';
      top = '85%';
      center = ['50%', '40%'];
      titleTop = '35%';
      titleLeft = 'center';
      titleText = ' ' + totalLPPerc.toFixed(2) + '%';
      toolboxOrient = 'horizontal';
    }

    this.pieOptionsMCCN = {
      title: {
        text: titleText,
        subtext: ' ' + this.translation.resume.assets_in_lp,
        left: titleLeft,
        top: titleTop,
        textStyle: {
          fontSize: 30,
          fontFamily: 'Inner Lato',
          color: 'rgba(31, 120, 180, 1)',
        },
        subtextStyle: {
          fontSize: 12,
          fontFamily: 'Inner Lato',
          color: this.pieChartTheme,
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
          color: "#ffffff"
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
          borderColor: this.pieChartTheme,
        },
      },
      legend: {
        type: 'scroll',
        icon: 'circle',
        orient: toolboxOrient,
        left: left,
        top: top,
        itemGap: 25,
        textStyle: {
          fontFamily: 'Inner Lato',
          fontSize: 16,
          color: this.pieChartTheme,
        },
        pageTextStyle: {
          fontFamily: 'Inner Lato',
          color: this.pieChartTheme,
        },
        pageIconColor: this.chartThemePaginator,
      },
      series: [
        {
          name: 'SERIE',
          type: 'pie',
          radius: ['65%', '90%'],
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
          data: dataSeries,
        },
      ],
    };
  }

  getHistoryChartDummyData() {
    return [
      {
        name: 'Imp. Loss',
        type: 'line',
        smooth: true,
        itemStyle: {
          normal: {
            color: CHART_COLORS_SCCN[0],
            opacity: 1,
          },
          emphasis: {
            color: CHART_COLORS_SCCN[0],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS_SCCN[0],
            width: 2,
          },
        },
        data: [
          ['04/13/2020 15:00', '0.0000'],
          ['04/13/2020 16:00', '-0.0024'],
          ['04/13/2020 16:00', '-0.0185'],
          ['04/13/2020 17:00', '-0.0184'],
          ['04/13/2020 18:00', '-0.0183'],
          ['04/13/2020 19:00', '-0.0254'],
          ['04/13/2020 20:00', '-0.0685'],
          ['04/13/2020 21:00', '-0.2133'],
          ['04/13/2020 22:00', '-0.2939'],
          ['04/14/2020 00:00', '-0.2941'],
          ['04/14/2020 01:00', '-0.3117'],
          ['04/14/2020 02:00', '-0.3403'],
          ['04/14/2020 03:00', '-0.4994'],
          ['04/14/2020 04:00', '-0.5441'],
          ['04/14/2020 05:00', '-0.4618'],
          ['04/14/2020 06:00', '-0.4687'],
          ['04/14/2020 07:00', '-0.4912'],
          ['04/14/2020 08:00', '-0.5934'],
          ['04/14/2020 09:00', '-0.7652'],
          ['04/14/2020 10:00', '-0.9224'],
          ['04/14/2020 11:00', '-0.7954'],
          ['04/14/2020 12:00', '-0.8652'],
          ['04/14/2020 13:00', '-0.9727'],
          ['04/14/2020 14:00', '-1.4734'],
          ['04/14/2020 15:00', '-1.8024'],
          ['04/14/2020 16:00', '-1.8244'],
          ['04/14/2020 17:00', '-1.6612'],
          ['04/14/2020 18:00', '-1.3589'],
          ['04/14/2020 19:00', '-1.3774'],
          ['04/14/2020 20:00', '-1.0866'],
          ['04/14/2020 21:00', '-1.0769'],
          ['04/14/2020 22:00', '-1.0011'],
          ['04/14/2020 23:00', '-1.0035'],
          ['04/15/2020 00:00', '-0.9892'],
          ['04/15/2020 01:00', '-1.0041'],
          ['04/15/2020 02:00', '-1.1617'],
          ['04/15/2020 03:00', '-1.2783'],
          ['04/15/2020 04:00', '-1.1137'],
          ['04/15/2020 05:00', '-1.0832'],
          ['04/15/2020 06:00', '-1.2754'],
          ['04/15/2020 07:00', '-1.2588'],
          ['04/15/2020 08:00', '-1.1904'],
          ['04/15/2020 09:00', '-1.1092'],
          ['04/15/2020 10:00', '-0.6470'],
        ],
      },
      {
        name: 'Total',
        type: 'line',
        smooth: true,
        itemStyle: {
          normal: {
            color: CHART_COLORS_SCCN[1],
            opacity: 1,
          },
          emphasis: {
            color: CHART_COLORS_SCCN[1],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS_SCCN[1],
            width: 2,
          },
        },
        data: [
          ['04/13/2020 15:00', '0.0000'],
          ['04/13/2020 16:00', '0.0110'],
          ['04/13/2020 16:00', '0.0042'],
          ['04/13/2020 17:00', '0.0071'],
          ['04/13/2020 18:00', '0.0052'],
          ['04/13/2020 19:00', '0.0173'],
          ['04/13/2020 20:00', '-0.0093'],
          ['04/13/2020 21:00', '-0.1365'],
          ['04/13/2020 22:00', '-0.2019'],
          ['04/14/2020 00:00', '-0.1812'],
          ['04/14/2020 01:00', '-0.1906'],
          ['04/14/2020 02:00', '-0.2041'],
          ['04/14/2020 03:00', '-0.3404'],
          ['04/14/2020 04:00', '-0.3721'],
          ['04/14/2020 05:00', '-0.2768'],
          ['04/14/2020 06:00', '-0.2730'],
          ['04/14/2020 07:00', '-0.2840'],
          ['04/14/2020 08:00', '-0.3750'],
          ['04/14/2020 09:00', '-0.5324'],
          ['04/14/2020 10:00', '-0.6748'],
          ['04/14/2020 11:00', '-0.5239'],
          ['04/14/2020 12:00', '-0.5819'],
          ['04/14/2020 13:00', '-0.6690'],
          ['04/14/2020 14:00', '-1.1416'],
          ['04/14/2020 15:00', '-1.4550'],
          ['04/14/2020 16:00', '-1.4503'],
          ['04/14/2020 17:00', '-1.2658'],
          ['04/14/2020 18:00', '-0.9294'],
          ['04/14/2020 19:00', '-0.9341'],
          ['04/14/2020 20:00', '-0.6107'],
          ['04/14/2020 21:00', '-0.5851'],
          ['04/14/2020 22:00', '-0.4893'],
          ['04/14/2020 23:00', '-0.4700'],
          ['04/15/2020 00:00', '-0.4397'],
          ['04/15/2020 01:00', '-0.4375'],
          ['04/15/2020 02:00', '-0.5751'],
          ['04/15/2020 03:00', '-0.6693'],
          ['04/15/2020 04:00', '-0.4817'],
          ['04/15/2020 05:00', '-0.4335'],
          ['04/15/2020 06:00', '-0.6030'],
          ['04/15/2020 07:00', '-0.5691'],
          ['04/15/2020 08:00', '-0.4819'],
          ['04/15/2020 09:00', '-0.3773'],
          ['04/15/2020 10:00', '0.1351'],
        ],
      },
      {
        name: 'Fee Accrual',
        type: 'line',
        smooth: true,
        itemStyle: {
          normal: {
            color: CHART_COLORS_SCCN[2],
            opacity: 1,
          },
          emphasis: {
            color: CHART_COLORS_SCCN[2],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS_SCCN[2],
            width: 2,
          },
        },
        data: [
          ['04/13/2020 15:00', '0.0000'],
          ['04/13/2020 16:00', '0.0129'],
          ['04/13/2020 16:00', '0.0227'],
          ['04/13/2020 17:00', '0.0256'],
          ['04/13/2020 18:00', '0.0235'],
          ['04/13/2020 19:00', '0.0428'],
          ['04/13/2020 20:00', '0.0591'],
          ['04/13/2020 21:00', '0.0769'],
          ['04/13/2020 22:00', '0.0922'],
          ['04/14/2020 00:00', '0.1131'],
          ['04/14/2020 01:00', '0.1212'],
          ['04/14/2020 02:00', '0.1361'],
          ['04/14/2020 03:00', '0.1595'],
          ['04/14/2020 04:00', '0.1725'],
          ['04/14/2020 05:00', '0.1855'],
          ['04/14/2020 06:00', '0.1963'],
          ['04/14/2020 07:00', '0.2078'],
          ['04/14/2020 08:00', '0.2192'],
          ['04/14/2020 09:00', '0.2339'],
          ['04/14/2020 10:00', '0.2489'],
          ['04/14/2020 11:00', '0.2729'],
          ['04/14/2020 12:00', '0.2861'],
          ['04/14/2020 13:00', '0.3076'],
          ['04/14/2020 14:00', '0.3391'],
          ['04/14/2020 15:00', '0.3585'],
          ['04/14/2020 16:00', '0.3847'],
          ['04/14/2020 17:00', '0.4043'],
          ['04/14/2020 18:00', '0.4365'],
          ['04/14/2020 19:00', '0.4514'],
          ['04/14/2020 20:00', '0.4807'],
          ['04/14/2020 21:00', '0.4965'],
          ['04/14/2020 22:00', '0.5175'],
          ['04/14/2020 23:00', '0.5396'],
          ['04/15/2020 00:00', '0.5555'],
          ['04/15/2020 01:00', '0.5731'],
          ['04/15/2020 02:00', '0.5947'],
          ['04/15/2020 03:00', '0.6176'],
          ['04/15/2020 04:00', '0.6388'],
          ['04/15/2020 05:00', '0.6565'],
          ['04/15/2020 06:00', '0.6811'],
          ['04/15/2020 07:00', '0.6976'],
          ['04/15/2020 08:00', '0.7164'],
          ['04/15/2020 09:00', '0.7373'],
          ['04/15/2020 10:00', '0.7841'],
        ],
      },
    ];
  }

  getHistoryChartData(assetData: HistoryChartData) {
    return [
      {
        name: 'Imp. Loss',
        type: 'line',
        smooth: true,
        itemStyle: {
          normal: {
            color: CHART_COLORS_SCCN[0],
            opacity: 1,
          },
          emphasis: {
            color: CHART_COLORS_SCCN[0],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS_SCCN[0],
            width: 2,
          },
        },
        data: assetData.imp_loss,
      },
      {
        name: 'Total',
        type: 'line',
        smooth: true,
        itemStyle: {
          normal: {
            color: CHART_COLORS_SCCN[1],
            opacity: 1,
          },
          emphasis: {
            color: CHART_COLORS_SCCN[1],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS_SCCN[1],
            width: 2,
          },
        },
        data: assetData.total,
      },
      {
        name: 'Fee Accrual',
        type: 'line',
        smooth: true,
        itemStyle: {
          normal: {
            color: CHART_COLORS_SCCN[2],
            opacity: 1,
          },
          emphasis: {
            color: CHART_COLORS_SCCN[2],
            borderWidth: 2,
            opacity: 1,
          },
        },
        lineStyle: {
          normal: {
            color: CHART_COLORS_SCCN[2],
            width: 2,
          },
        },
        data: assetData.fee_accrual,
      },
    ];
  }

  goBack() {
    if (window.history.length == 0) {
      this.router.navigate(['/']);
    } else {
      window.history.back();
    }
    /*let url = '/app/poolrates';
  this.router.navigateByUrl(url);*/
  }

  getHodlNumber(pool: any): number {
    let hodl = 0;
    let lpVsHodl = 0;
    let assetName = pool.pool;
    let rune = pool.original.stake.targetAmount;
    let asset = +pool.original.stake.assetAmount;

    if (this.currencyName == 'BUSD') {
      let assetData = this.stakerPoolsPrice.filter(
        (pool) => pool.asset == assetName
      );
      if (assetData.length > 0) {
        let runeValue = rune / this.busdPrice.toNumber();
        let assetValue =
          (asset * +assetData[0].priceRune) / this.busdPrice.toNumber();
        hodl = runeValue + assetValue;
        lpVsHodl = pool.profit.totalPool - hodl;
      }
    } else {
      let totalStake = pool.profit.totalStake;
      let totalProfit = pool.profit.totalPool;

      lpVsHodl = totalProfit - totalStake;
    }

    return lpVsHodl / 100000000;
  }

  getHodlBUSD(pool: any): string {
    let hodl = 0;
    let lpVsHodl = '';
    let assetName = pool.pool;
    let rune = pool.original.stake.targetAmount;
    let asset = +pool.original.stake.assetAmount;

    if (this.currencyName == 'BUSD') {
      let assetData = this.stakerPoolsPrice.filter(
        (pool) => pool.asset == assetName
      );
      if (assetData.length > 0) {
        let runeValue = rune / this.busdPrice.toNumber();
        let assetValue =
          (asset * +assetData[0].priceRune) / this.busdPrice.toNumber();
        hodl = runeValue + assetValue;
        lpVsHodl =
          this.roundedPipe.transform(
            (pool.profit.totalPool - hodl) / 100000000
          ) + this.getSimbol();
      }
    } else if (
      this.currencyName != 'BUSD' &&
      +pool.profit.totalStake / 100000000 >= 0.01
    ) {
      let totalStake = pool.profit.totalStake;
      let totalProfit = pool.profit.totalPool;

      lpVsHodl =
        ((totalProfit - totalStake) / 100000000).toFixed(2) + this.getSimbol();
    } else {
      let totalStake = pool.profit.totalStake;
      let totalProfit = pool.profit.totalPool;

      lpVsHodl =
        ((totalProfit - totalStake) / 100000000).toFixed(4) + this.getSimbol();
    }
    return lpVsHodl;
  }

  getHodlBUSDFormula(pool: any): string {
    let hodl = 0;
    let lpVsHodl = 0;
    let lpVsHodlFormula = '';
    let assetName = pool.pool;
    let rune = pool.original.stake.targetAmount;
    let asset = +pool.original.stake.assetAmount;

    if (this.currencyName == 'BUSD') {
      let assetData = this.stakerPoolsPrice.filter(
        (pool) => pool.asset == assetName
      );
      if (assetData.length > 0) {
        let runeValue = rune / this.busdPrice.toNumber();
        let assetValue =
          (asset * +assetData[0].priceRune) / this.busdPrice.toNumber();
        hodl = runeValue + assetValue;
        lpVsHodl = pool.profit.totalPool - hodl;

        lpVsHodlFormula =
          this.decimalPipe.transform(
            pool.profit.totalPool / 100000000,
            '1.0-2'
          ) +
          this.getSimbol() +
          ' - ' +
          this.decimalPipe.transform(hodl / 100000000, '1.0-2') +
          this.getSimbol() +
          ' = ' +
          this.decimalPipe.transform(lpVsHodl / 100000000, '1.0-2') +
          this.getSimbol();
      }
    } else if (
      this.currencyName != 'BUSD' &&
      +pool.profit.totalStake / 100000000 >= 0.01
    ) {
      let totalStake = pool.profit.totalStake;
      let totalProfit = pool.profit.totalPool;

      lpVsHodl = totalProfit - totalStake;

      lpVsHodlFormula =
        this.decimalPipe.transform(totalProfit / 100000000, '1.0-2') +
        this.getSimbol() +
        ' - ' +
        this.decimalPipe.transform(totalStake / 100000000, '1.0-2') +
        this.getSimbol() +
        ' = ' +
        this.decimalPipe.transform(lpVsHodl / 100000000, '1.0-2') +
        this.getSimbol();
    } else {
      let totalStake = pool.profit.totalStake;
      let totalProfit = pool.profit.totalPool;

      lpVsHodl = totalProfit - totalStake;

      lpVsHodlFormula =
        this.decimalPipe.transform(totalProfit / 100000000, '1.0-4') +
        this.getSimbol() +
        ' - ' +
        this.decimalPipe.transform(totalStake / 100000000, '1.0-4') +
        this.getSimbol() +
        ' = ' +
        this.decimalPipe.transform(lpVsHodl / 100000000, '1.0-4') +
        this.getSimbol();
    }

    return lpVsHodlFormula;
  }

  setColor(label) {
    if (this.perdiodRangeLabel == label) {
      return 'accent';
    } else {
      return 'grey';
    }
  }

  getPeriod(value: string, label: string) {
    if (this.perdiodRangeValue != value) {
      this.perdiodRangeValue = value;
      this.perdiodRangeLabel = label;
    } else {
      this.perdiodRangeValue = '24h';
      this.perdiodRangeLabel = '24H';
    }

    let period = this.periods.filter(
      (period) => period.value == this.perdiodRangeValue
    );
    let trackingLiquiditySub = this.masterWalletManagerService
      .getMCCNTrackingLiquidity(this.address, period[0].api)
      .subscribe();

    this.subs.push(trackingLiquiditySub);
  }
}
