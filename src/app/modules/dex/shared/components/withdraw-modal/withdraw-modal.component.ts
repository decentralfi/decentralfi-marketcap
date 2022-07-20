import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { formatNumber } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { combineLatest, Subscription } from 'rxjs';

// DEPENDENCIES
import BigNumber from 'bignumber.js';
import { Balance } from '@xchainjs/xchain-client';

// THORCHAIN
import {
  PoolData,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
  UnitData,
  getPoolShare,
} from '@thorchain/asgardex-util';

import {
  assetToString,
  assetToBase,
  assetAmount,
  baseAmount,
} from '@xchainjs/xchain-util';

// CLASES
import { Asset } from '@dexShared/classes/asset';
import { PoolAddressDTO } from '@dexShared/classes/pool-address';
import { User } from '../../classes/user';
import { Pool } from '@dexShared/classes/pool';

// DIALOGS
import { AssetsDialogComponent } from '@dexShared/dialogs/assets-dialog/assets-dialog.component';
import { ConfirmKeystorePasswordComponent } from '@dexShared/dialogs/confirm-keystore-password/confirm-keystore-password.component';
import {
  ConfirmWithdrawDialogComponent,
  ConfirmWithdrawData,
} from './confirm-withdraw-dialog/confirm-withdraw-dialog.component';

// INTERFACES
import { PoolDTO } from '@dexShared/interfaces/pool';
import {
  WalletData,
  MidgardPool,
  Stats,
  MemberDetail,
} from '@dexShared/interfaces/marketcap';

// SERVICES
import { WalletBalanceService } from '@dexShared/services/wallet-balance.service';
import { MidgardService } from '@dexShared/services/midgard.service';
import { AssestUsdPriceService } from '@dexShared/services/assest-usd-price.service';
import { TransactionUtilsService } from '@dexShared/services/transaction-utils.service';
import { MarketcapOperationsService } from '@dexShared/services/marketcap-operations.service';
import { MasterWalletManagerService } from 'src/app/services/master-wallet-manager.service';

import { Amount } from '@dexShared/classes/amount';
import { Liquidity } from '@dexShared/classes/liquidity';
import { Percent } from '../../classes/percentage';
import { UserService } from '../../services/user.service';
import {
  PoolTypeOption,
  AvailablePoolTypeOptions,
} from '../../constants/pool-type-options';
import { ConfirmTransactionDialogComponent } from '../../dialogs/confirm-transaction/confirm-transaction.component';
import { consoleLog } from '@app/utils/consoles';
import { TranslateService } from '@ngx-translate/core';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

interface iUpdateAssetUnits {
  inputValue: number;
  isRune: boolean;
  name?: 'send' | 'received';
}
interface wrappedMembers {
  wallet: WalletData;
  lpData: void | MemberDetail;
}

@Component({
  selector: 'app-withdraw-modal',
  templateUrl: './withdraw-modal.component.html',
  styleUrls: ['./withdraw-modal.component.scss'],
})
export class WithdrawModalComponent implements OnInit, OnDestroy {
  public operation: 'withdraw' = 'withdraw';
  @Output() isDisabled = new EventEmitter<boolean>();
  @Input() balance: number;
  @Input() walletReceiveAsset: WalletData;
  @Input() walletSendAsset: WalletData;
  @Input() walletType: string;

  private liquidityEntity: Liquidity;

  public inputUsdValueIn: string;
  public inputUsdValueOut: string;

  public originalPools: MidgardPool[];
  public originalStats: Stats;
  public runePriceUSD: number;

  public subs: Subscription[] = [];

  // COLOR THEME
  public themeValue = '';
  public dialogPanelClass: string;
  public dialogBackdropColorClass: string;

  // public wallet: string;
  public hintIn = ''; // QUITAR
  public hintOut = ''; // QUITAR
  public balanceIn: number;
  public balanceOut: number;
  public balanceInUSD: number;
  public balanceOutUSD: number;

  public assetUnitIn = new FormControl();
  public assetUnitOut = new FormControl(0);

  public assetUnitInHint: string;

  public showConfirm = false;
  public rune = 'RUNE'; //'RUNE-67C'
  public bnb = 'BNB';
  public assetIn: Asset = new Asset(`BNB.${this.bnb}`);
  public assetOut: Asset = new Asset(`THOR.${this.rune}`);

  public basePrice: number;
  public assetTokenValueIn: Amount;
  public slip: number | string;

  public balances: Balance[];
  public poolDetailOutError: boolean;
  public poolDetailInError: boolean;
  public poolDetailMap: { [key: string]: PoolDTO } = {};
  public targetAssetUnit: BigNumber;
  public binanceTransferFee: BigNumber;

  public inboundFees: { [key: string]: number } = {};
  public outboundFees: { [key: string]: number } = {};

  // FEE
  public networkFeeIn: number;
  public networkFeeOut: number;
  public inboundFeeToUsdValue: number;
  public totalFeeToUSD: number;

  haltedChains: string[];

  public availablePools: PoolDTO[];
  public ethPool: PoolDTO;
  public inboundAddresses: PoolAddressDTO[];

  public user: User[];
  public value = 0;

  public withdrawType: PoolTypeOption;
  public poolTypeOptions: AvailablePoolTypeOptions = {
    asymAsset: false,
    asymRune: false,
    sym: true,
  };
  public asymAsset = false;
  public asymRune = false;
  public sym = false;
  public pool: Pool;

  public withdrawPercent: number;
  public investedAssetAmount: number;
  public investedRuneAmount: number;
  public asymBalance: number;
  public assetPoolData: any;
  public pools: Pool[];
  public poolsDTO: PoolDTO[];
  public poolShare: string;

  public memberQueryStatus:
    | 'QUERYING'
    | 'QUERY_ERROR'
    | 'HAS_NO_LIQUIDITY'
    | 'HAS_LIQUIDITY' = 'QUERYING';

  public LPUnits: string;
  public showFeeDetails = true;
  public assetMember: {
    pool: string;
    runeAddress: string;
    assetAddress: string;
    liquidityUnits: string;
    runeAdded: string;
    assetAdded: string;
    runeWithdrawn: string;
    assetWithdrawn: string;
    dateFirstAdded: string;
    dateLastAdded: string;
  };
  public runeMember: {
    pool: string;
    runeAddress: string;
    assetAddress: string;
    liquidityUnits: string;
    runeAdded: string;
    assetAdded: string;
    runeWithdrawn: string;
    assetWithdrawn: string;
    dateFirstAdded: string;
    dateLastAdded: string;
  };
  public fullname: string;

  public addIsValid: boolean;
  public hasWallet: boolean;
  public walletData: WalletData[];
  public membersArray: wrappedMembers[];

  public language: string;
  public translation: any;

  constructor(
    public dialog: MatDialog,
    public walletBalanceService: WalletBalanceService,
    private assestUsdPriceService: AssestUsdPriceService,
    private userService: UserService,
    private midgardService: MidgardService,
    private txUtilsService: TransactionUtilsService,
    private operationsService: MarketcapOperationsService,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    this.withdrawType = 'SYM';
    this.withdrawPercent = 0; // 0
    this.investedAssetAmount = 0;
    this.investedRuneAmount = 0;

    this.haltedChains = [];
    const user$ = this.userService.user$.subscribe(async (user) => {
      this.user = user;
    });
    this.subs = [
      user$,
      // slippageTolerange$
    ];
  }

  ngOnInit(): void {
    const walletSendSub = this.operationsService.walletSend$.subscribe(
      (walletSend) => {
        if (
          this.walletSendAsset != null &&
          walletSend != null &&
          walletSend.type != this.walletSendAsset.type
        ) {
          this.getWithdrawParams();
        }
        this.walletSendAsset = walletSend;

        if (this.walletSendAsset && this.walletReceiveAsset) {
          this.hasWallet = true;
        } else {
          this.hasWallet = false;
        }

        const assetInSub = this.operationsService.assetIn$.subscribe(
          (assetIn) => {
            if (assetIn.isRUNE() == false) {
              // REASSING ASSETS DEPENDING OF THE SELECTED TOKEN
              this.assetIn = assetIn;

              const walletBalance = this.walletSendAsset.balance;
              let tempBalance = 0;
              for (let i = 0; i < walletBalance.length; i++) {
                if (walletBalance[i].asset == this.assetIn.symbol) {
                  walletBalance[i].asset == 'BCH' ||
                  walletBalance[i].asset == 'rune'
                    ? (tempBalance = walletBalance[i].amount / 100000000)
                    : (tempBalance = walletBalance[i].amount);
                }
              }
              //this.balanceIn = tempBalance;

              this.assestUsdPriceService
                .calUsdPrice(this.balanceIn, this.assetIn.ticker)
                .then((usd) => {
                  this.balanceInUSD = usd;
                });
            } else {
              const poolInSub = this.operationsService.poolIn$.subscribe(
                (poolIn) => {
                  this.operationsService.setAssetIn(
                    new Asset(poolIn.asset.fullname)
                  );
                  this.operationsService.setAssetOut(new Asset('THOR.RUNE'));
                }
              );
              this.subs.push(poolInSub);
            }
          }
        );

        this.subs.push(assetInSub);
      }
    );

    this.assetOut = new Asset('THOR.RUNE');

    const originalStatsSub =
      this.masterWalletManagerService.originalStats$.subscribe((stats) => {
        if (stats != null) {
          this.runePriceUSD = +stats.runePriceUSD;
          this.originalStats = stats;
        }
      });

    const originalPoolsSub = this.masterWalletManagerService
      .getOriginalPools()
      .subscribe((pools) => {
        if (pools != null) {
          this.originalPools = pools;
        }
      });

    const walletRecieveSub =
      this.masterWalletManagerService.walletData$.subscribe((walletData) => {
        this.walletReceiveAsset = walletData?.filter(
          (wallet) =>
            wallet.chain === 'THOR' && wallet.type == this.walletSendAsset.type
        )[0];

        if (this.walletSendAsset && this.walletReceiveAsset) {
          this.hasWallet = true;
        } else {
          this.hasWallet = false;
        }
      });

    this.subs.push(
      walletSendSub,
      walletRecieveSub,
      originalStatsSub,
      originalPoolsSub
    );

    this.themeValue = localStorage.getItem('dcf-theme');
    if (this.themeValue === '' || this.themeValue === 'light-theme') {
      localStorage.setItem('dcf-theme', this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-light';
      this.dialogPanelClass = 'wallet-connect-panel-light';
    } else {
      this.themeValue = 'dark-theme';
      localStorage.setItem('dcf-theme', this.themeValue);
      this.dialogBackdropColorClass = 'wallet-connect-backdrop-dark';
      this.dialogPanelClass = 'wallet-connect-panel-dark';
    }
    this.getWithdrawParams();

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  getWithdrawParams() {
    this.memberQueryStatus = 'QUERYING';
    this.membersArray = undefined;
    const walletData = this.masterWalletManagerService.walletData$;
    const inboundAddresses$ = this.midgardService.getInboundAddresses();
    const pools$ = this.midgardService.getPools();
    const combined = combineLatest([inboundAddresses$, pools$, walletData]);

    const sub = combined.subscribe(([inboundAddresses, pools, walletData]) => {
      this.inboundAddresses = inboundAddresses;
      this.poolsDTO = pools;
      this.walletData = walletData.filter(
        (wallet) => wallet.type == this.walletSendAsset.type
      );

      // check for halted chains
      this.setHaltedChains();

      this.getLiquidityUnits(pools);
      this.setAvailablePools(pools);

      // update network fees
      this.setNetworkFees();
    });
    this.subs.push(sub);
  }

  changeSubOperacion(operationType: PoolTypeOption) {
    this.withdrawType = operationType;

    switch (operationType) {
      case 'ASYM_ASSET':
        this.poolTypeOptions = {
          asymAsset: true,
          asymRune: false,
          sym: false,
        };
        this.showConfirm = false;
        break;
      case 'SYM':
        this.poolTypeOptions = {
          sym: true,
          asymAsset: false,
          asymRune: false,
        };
        this.showConfirm = false;
        break;
      case 'ASYM_RUNE':
        this.poolTypeOptions = {
          asymRune: true,
          asymAsset: false,
          sym: false,
        };
        this.showConfirm = false;
        break;
      default:
        this.poolTypeOptions = {
          asymAsset: false,
          asymRune: false,
          sym: true,
        };
        this.showConfirm = false;
    }
    // update network fees
    this.setNetworkFees();
    this.clean();

    if (this.assetMember && this.runeMember) {
      if (operationType == 'ASYM_ASSET') {
        this.setWithdrawData(this.poolsDTO, this.fullname, this.assetMember);
      } else if (operationType == 'ASYM_RUNE') {
        this.setWithdrawData(this.poolsDTO, this.fullname, this.runeMember);
      }
    }
  }

  confirmWithDraw(goBack = true) {
    if (goBack) {
      if (
        this.withdrawType == 'SYM' &&
        this.assetUnitIn.value > 0 &&
        this.assetUnitOut.value > 0
      ) {
        this.showConfirm = true;
      } else if (
        this.withdrawType == 'ASYM_ASSET' &&
        this.assetUnitIn.value > 0
      ) {
        this.showConfirm = true;
      } else if (
        this.withdrawType == 'ASYM_RUNE' &&
        this.assetUnitOut.value > 0
      ) {
        this.showConfirm = true;
      }

      if (
        this.haltedChains.find(
          (chain) => chain === this.assetIn.chain.toString()
        )
      ) {
        this.showConfirm = false;
      }
    } else {
      this.showConfirm = false;
    }

    this.isDisabled.emit(this.showConfirm);
  }

  setHaltedChains() {
    this.haltedChains = this.inboundAddresses
      .filter((inboundAddress) => inboundAddress.halted)
      .map((inboundAddress) => inboundAddress.chain);
  }

  setAvailablePools(pools: PoolDTO[]) {
    this.availablePools = pools
      .filter((pool) => pool.status === 'available')
      .filter(
        (pool) => !this.haltedChains.includes(new Asset(pool.asset).chain)
      );

    this.pools = this.availablePools.map((pool) => {
      // INPROOVE
      return new Pool(
        new Asset(pool.asset),
        new Amount(pool.runeDepth, 1, 8),
        new Amount(pool.assetDepth, 1, 8),
        pool
      );
    });
  }

  async getLiquidityUnits(pools: PoolDTO[]) {
    const fullname =
      this.assetIn.symbol === 'RUNE'
        ? `${this.assetOut.chain}.${this.assetOut.symbol}`
        : `${this.assetIn.chain}.${this.assetIn.symbol}`;

    const membersArray: wrappedMembers[] = [];
    for (let i = 0; i < this.walletData.length; i++) {
      const res = await this.midgardService
        .getMembersDetail(this.walletData[i].address)
        .toPromise()
        .catch((err) => {
          //consoleLog(err);
        });
      if (res != undefined) {
        const memberData: wrappedMembers = {
          wallet: this.walletData[i],
          lpData: res,
        };
        membersArray.push(memberData);
      }
    }
    this.membersArray = membersArray;

    const assetResFilter = membersArray.filter(
      (member) =>
        member.wallet.chain == this.walletSendAsset.chain &&
        member.wallet.type == this.walletSendAsset.type
    );
    const assetRes: void | MemberDetail | undefined[] =
      assetResFilter.length > 0 ? assetResFilter[0].lpData : [];

    const runeResFilter = membersArray.filter(
      (member) =>
        member.wallet.chain == 'THOR' &&
        member.wallet.type == this.walletSendAsset.type
    );
    const runeRes: void | MemberDetail | undefined[] =
      runeResFilter.length > 0 ? runeResFilter[0].lpData : [];

    const assetMemberArray = (assetRes as MemberDetail).pools
      ? (assetRes as MemberDetail).pools.filter(({ pool }) => pool === fullname)
      : [];

    const runeMemberArray = (runeRes as MemberDetail).pools
      ? (runeRes as MemberDetail).pools.filter(({ pool }) => pool === fullname)
      : [];

    if (
      pools &&
      assetMemberArray &&
      assetMemberArray.length > 0 &&
      runeMemberArray &&
      runeMemberArray.length > 0
    ) {
      for (let a = 0; a < assetMemberArray.length; a++) {
        for (let r = 0; r < runeMemberArray.length; r++) {
          if (
            JSON.stringify(assetMemberArray[a]) ==
            JSON.stringify(runeMemberArray[r])
          ) {
            const member = assetMemberArray[a];
            this.memberQueryStatus = 'HAS_LIQUIDITY';
            this.asymRune = true;
            this.asymAsset = true;
            this.sym = true;
            this.setWithdrawData(pools, fullname, member);
            this.changeSubOperacion('SYM');
            consoleLog('SYM');
          }
        }
      }
      if (this.memberQueryStatus != 'HAS_LIQUIDITY') {
        for (let a = 0; a < assetMemberArray.length; a++) {
          for (let r = 0; r < runeMemberArray.length; r++) {
            if (
              JSON.stringify(assetMemberArray[a]) !=
              JSON.stringify(runeMemberArray[r])
            ) {
              this.memberQueryStatus = 'HAS_LIQUIDITY';
              this.asymRune = false;
              this.asymAsset = true;
              this.sym = false;
              this.setWithdrawData(
                pools,
                fullname,
                assetMemberArray[a],
                runeMemberArray[r]
              );
              this.changeSubOperacion('ASYM_ASSET');
              consoleLog('ASYM_RUNE_ASSET');
            }
          }
        }
      }
    } else if (
      pools &&
      assetMemberArray &&
      assetMemberArray.length == 0 &&
      runeMemberArray &&
      runeMemberArray.length > 0
    ) {
      const member = runeMemberArray[0];
      this.memberQueryStatus = 'HAS_LIQUIDITY';
      this.asymRune = true;
      this.asymAsset = false;
      this.sym = false;
      this.setWithdrawData(pools, fullname, member);
      this.changeSubOperacion('ASYM_RUNE');
      consoleLog('ASYM_RUNE');
    } else if (
      pools &&
      assetMemberArray &&
      assetMemberArray.length > 0 &&
      runeMemberArray &&
      runeMemberArray.length == 0
    ) {
      const member = assetMemberArray[0];
      this.memberQueryStatus = 'HAS_LIQUIDITY';
      this.asymRune = false;
      this.asymAsset = true;
      this.sym = false;
      this.setWithdrawData(pools, fullname, member);
      this.changeSubOperacion('ASYM_ASSET');
      consoleLog('ASYM_ASSET');
    } else if (assetMemberArray.length == 0 && runeMemberArray.length == 0) {
      this.memberQueryStatus = 'HAS_NO_LIQUIDITY';
      consoleLog('HAS_NO_LIQUIDITY');
    } else {
      consoleLog('NO_CONDITIONS');
    }
  }

  setWithdrawData(
    pools: PoolDTO[],
    assetFullName: string,
    member: {
      pool: string;
      runeAddress: string;
      assetAddress: string;
      liquidityUnits: string;
      runeAdded: string;
      assetAdded: string;
      runeWithdrawn: string;
      assetWithdrawn: string;
      dateFirstAdded: string;
      dateLastAdded: string;
    },
    runeMemberArray?: {
      pool: string;
      runeAddress: string;
      assetAddress: string;
      liquidityUnits: string;
      runeAdded: string;
      assetAdded: string;
      runeWithdrawn: string;
      assetWithdrawn: string;
      dateFirstAdded: string;
      dateLastAdded: string;
    }
  ) {
    if (runeMemberArray) {
      this.fullname = assetFullName;
      this.assetMember = member;
      this.runeMember = runeMemberArray;
    }
    const poolItem = pools.filter(({ asset }) => asset === assetFullName)[0];

    const pool = new Pool(
      poolItem.asset as unknown as Asset,
      new Amount(poolItem.runeDepth, 1, 8),
      new Amount(poolItem.assetDepth, 1, 8),
      poolItem
    );

    this.LPUnits = member.liquidityUnits;

    this.assetPoolData = {
      assetBalance: baseAmount(poolItem.assetDepth),
      runeBalance: baseAmount(poolItem.runeDepth),
    };

    this.liquidityEntity = new Liquidity(
      pool,
      Amount.fromMidgard(member?.liquidityUnits ?? 0)
    );

    this.pool = pool;

    //POOL SHARE

    const poolShare = this.liquidityEntity?.poolShare;

    this.poolShare = new Percent(poolShare.assetAmount.toNumber()).toFixed(5);

    const unitData: UnitData = {
      stakeUnits: baseAmount(member?.liquidityUnits ?? 0),
      totalUnits: baseAmount(poolItem.units),
    };

    // AMMOUNTS IN POOL

    const poolShares = getPoolShare(unitData, this.assetPoolData);

    const runeAmountAfterFee = poolShares.rune
      .amount()
      .div(10 ** 8)
      .toNumber();

    this.investedRuneAmount = runeAmountAfterFee;

    const assetAmountAfterFee = poolShares.asset
      .amount()
      .div(10 ** 8)
      .toNumber();

    this.investedAssetAmount =
      assetAmountAfterFee <= 0
        ? 0
        : isNaN(assetAmountAfterFee)
        ? 0
        : assetAmountAfterFee ?? 0;
  }

  async setNetworkFees() {
    if (!this.availablePools || !this.inboundAddresses) {
      return;
    }

    for (const pool of this.availablePools) {
      const asset = new Asset(pool.asset);

      const assetOutboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'OUTBOUND',
        pool
      );

      const assetInboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'INBOUND',
        pool
      );

      this.outboundFees[pool.asset] = assetOutboundFee;
      this.inboundFees[pool.asset] = assetInboundFee;
    }

    // set THOR.RUNE network fees
    this.outboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'OUTBOUND'
    );

    this.inboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'INBOUND'
    );

    const inboundFee = this.inboundFees[assetToString(this.assetIn)];
    const outboundFee = this.outboundFees[assetToString(this.assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;

    /*const inboundFeeToUSD = await this.assestUsdPriceService.calUsdPrice(
      inboundFee,
      this.assetIn.ticker
    );*/
    const assetInUSDPrice = +this.originalPools.filter((pool) => {
      if (this.assetIn.chain === 'ETH') {
        return pool.asset.name === 'ETH.ETH';
      }
      if (this.assetIn.chain === 'BNB') {
        return pool.asset.name === 'BNB.BNB';
      }
      return pool.asset.name === this.assetIn.fullname;
    })[0].asset_price_usd;

    const inboundFeeToUSD = inboundFee * assetInUSDPrice;

    /*const outboundFeeToUSD = await this.assestUsdPriceService.calUsdPrice(
      outboundFee,
      this.assetOut.ticker
    );*/

    const outboundFeeToUSD = outboundFee * this.runePriceUSD;

    this.inboundFeeToUsdValue =
      this.withdrawType === 'ASYM_ASSET' ? inboundFeeToUSD : outboundFeeToUSD;

    this.totalFeeToUSD = inboundFeeToUSD + outboundFeeToUSD;
  }

  // HERE WE RECEIVED THE VALUE FROM INPUT
  async inputValueComing(res: iUpdateAssetUnits) {
    if (res.inputValue != 0) {
      this.addIsValid = true;
    } else {
      this.addIsValid = false;
    }
    if (res.name === 'received') {
      consoleLog('REC');
      if (
        res.inputValue > this.getSharedAmount() &&
        this.withdrawType !== 'SYM'
      ) {
        res.inputValue = this.getSharedAmount();
      }

      this.assetUnitOut.setValue(
        isNaN(res.inputValue) ? 0 : res.inputValue ?? 0
      );

      this.getParams();
    } else {
      consoleLog('SEN');

      let max = 0;
      if (this.withdrawType == 'ASYM_ASSET') {
        if (res.inputValue > this.getSharedAmount()) {
          max = this.maximumSpendableBalance(
            this.assetIn.ticker,
            this.getSharedAmount()
          );
          res.inputValue = max;
        }
      } else {
        if (res.inputValue > this.investedAssetAmount) {
          max = this.maximumSpendableBalance(
            this.assetIn.ticker,
            this.investedAssetAmount
          );
          res.inputValue = max;
        }
      }

      this.assetUnitIn.setValue(
        isNaN(res.inputValue) ? 0 : res.inputValue ?? 0
      );

      if (this.assetUnitIn.value > this.balanceIn) {
        this.assetUnitInHint = 'Not enough balance';
      } else {
        this.assetUnitInHint = '';
      }

      // this.assetTokenValueIn = assetToBase(assetAmount(inputValue));
      this.assetTokenValueIn = Amount.fromAssetAmount(res.inputValue, 8);

      if (this.assetIn && this.assetIn.symbol !== this.rune) {
        this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
      } else if (this.assetIn && this.assetIn.symbol === this.rune) {
        this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
        this.updateSwapDetails();
      }
    }
  }

  setAsset(field: 'in' | 'out') {
    let selectedToken = '';
    if (field === 'out') {
      selectedToken = this.assetIn.ticker;
    } else {
      selectedToken = 'RUNE';
    }

    const dialogRef = this.dialog.open(AssetsDialogComponent, {
      autoFocus: false,
      backdropClass: this.dialogBackdropColorClass,
      panelClass: this.dialogPanelClass,
      data: {
        field,
        disabledAssetSymbol: selectedToken,
        type: 'withdraw',
        withdrawData: this.membersArray,
      },
    });

    dialogRef.afterClosed().subscribe((selection) => {
      if (selection != undefined) {
        if (selection.field == 'in') {
          if (selection.item.type == 'SYM') {
            this.asymRune = true;
            this.asymAsset = true;
            this.sym = true;
            this.investedAssetAmount = selection.item.detail.assetAdded;
            this.investedRuneAmount = selection.item.detail.runeAdded;
          } else if (selection.item.type == 'ASYM_ASSET') {
            this.asymRune = false;
            this.asymAsset = true;
            this.sym = false;
            this.investedAssetAmount = selection.item.detail.assetAdded;
          } else if (selection.item.type == 'ASYM_RUNE') {
            this.asymRune = true;
            this.asymAsset = false;
            this.sym = false;
            this.investedRuneAmount = selection.item.detail.runeAdded;
          }
          this.assetUnitIn.setValue(0);
          this.assetUnitOut.setValue(0);
          this.operationsService.setAssetIn(selection.item.asset);
          const chainWallet = this.walletData.filter(
            (wallet) =>
              wallet.chain == selection.item.asset.chain &&
              wallet.type == selection.item.wallet.type
          )[0];
          this.operationsService.setWalletSend(chainWallet);
          this.changeSubOperacion(selection.item.type);
          this.setWithdrawData(
            this.poolsDTO,
            selection.item.asset.fullname,
            selection.item.detail
          );
          this.setNetworkFees();
          this.clean();
        }
      }
    });
  }

  getPoolDetails(chain: string, symbol: string, type: 'in' | 'out') {
    this.poolDetailOutError = type === 'out' ? false : this.poolDetailOutError;
    this.poolDetailInError = type === 'in' ? false : this.poolDetailInError;

    this.midgardService.getPoolDetails(`${chain}.${symbol}`).subscribe(
      (res) => {
        if (res) {
          this.poolDetailMap[symbol] = res;
          this.updateSwapDetails();
        }
      },
      (err) => {
        console.error('error fetching pool details: ', err);
        this.poolDetailOutError =
          type === 'out' ? true : this.poolDetailOutError;
        this.poolDetailInError = type === 'in' ? true : this.poolDetailInError;
      }
    );
  }

  updateSwapDetails() {
    if (this.assetIn && this.assetOut) {
      this.calculateSingleSwap();
    }
  }

  async calculateSingleSwap() {
    const toRune = this.assetOut.symbol === this.rune ? true : false;

    const poolDetail = toRune
      ? this.poolDetailMap[this.assetIn.symbol]
      : this.poolDetailMap[this.assetOut.symbol];

    if (poolDetail) {
      const pool: PoolData = {
        assetBalance: baseAmount(poolDetail.assetDepth),
        runeBalance: baseAmount(poolDetail.runeDepth),
      };

      /**
       * TO SHOW BASE PRICE
       */

      const valueOfRuneInAsset = getValueOfRuneInAsset(
        assetToBase(assetAmount(1)),
        pool
      );
      const valueOfAssetInRune = getValueOfAssetInRune(
        assetToBase(assetAmount(1)),
        pool
      );

      const basePrice = toRune ? valueOfRuneInAsset : valueOfAssetInRune;
      this.basePrice = basePrice
        .amount()
        .div(10 ** 8)
        .toNumber();

      const outValue = this.assetTokenValueIn
        .mul(this.pool?.assetPriceInRune)
        .assetAmount.toNumber();

      this.assetUnitOut.setValue(isNaN(outValue) ? 0 : outValue ?? 0);

      this.getParams();
    }
  }

  async getParams() {
    const inUSD = this.assestUsdPriceService.getPrice({
      inputAsset: this.assetIn,
      pools: this.pools,
      inputAmount: isNaN(this.assetUnitIn.value)
        ? 0
        : this.assetUnitIn.value === ''
        ? 0
        : this.assetUnitIn.value ?? 0,
    });

    const outUSD = this.assestUsdPriceService.getPrice({
      inputAsset: this.assetOut,
      pools: this.pools,
      inputAmount: isNaN(this.assetUnitOut.value)
        ? 0
        : this.assetUnitOut.value ?? 0,
    });

    this.inputUsdValueIn = inUSD.toCurrencyFormat(2);

    this.inputUsdValueOut = outUSD.toCurrencyFormat(2);

    /**
     * Slip percentage using original input
     */

    const assetInValue = Amount.fromAssetAmount(this.assetUnitIn.value, 8);
    const assetOutValue = Amount.fromAssetAmount(this.assetUnitOut.value, 8);

    const slip = this.liquidityEntity.getLiquiditySlip(
      assetInValue,
      assetOutValue
    ) as Percent;

    this.slip = slip.toFixed(8);

    /**
     * Fee percentage
     */

    const inboundFee = this.inboundFees[assetToString(this.assetIn)];
    const outboundFee = this.outboundFees[assetToString(this.assetOut)];

    this.networkFeeIn = inboundFee;
    this.networkFeeOut = outboundFee;

    /*const inboundFeeToUSD = await this.assestUsdPriceService.calUsdPrice(
      inboundFee,
      this.assetIn.ticker
    );*/
    const assetInUSDPrice = +this.originalPools.filter((pool) => {
      if (this.assetIn.chain === 'ETH') {
        return pool.asset.name === 'ETH.ETH';
      }
      if (this.assetIn.chain === 'BNB') {
        return pool.asset.name === 'BNB.BNB';
      }
      return pool.asset.name === this.assetIn.fullname;
    })[0].asset_price_usd;

    const inboundFeeToUSD = inboundFee * assetInUSDPrice;

    /*const outboundFeeToUSD = await this.assestUsdPriceService.calUsdPrice(
      outboundFee,
      this.assetOut.ticker
    );*/

    const outboundFeeToUSD = outboundFee * this.runePriceUSD;

    this.inboundFeeToUsdValue =
      this.withdrawType === 'ASYM_ASSET' ? inboundFeeToUSD : outboundFeeToUSD;

    this.totalFeeToUSD = inboundFeeToUSD + outboundFeeToUSD;
  }

  setMax() {
    if (this.withdrawType !== 'ASYM_RUNE') {
      if (this.investedAssetAmount) {
        let max = this.maximumSpendableBalance(
          this.assetIn.ticker,
          this.investedAssetAmount
        );

        if (this.withdrawType === 'ASYM_ASSET') {
          consoleLog('ASYM_ASSET');
          max = this.maximumSpendableBalance(
            this.assetIn.ticker,
            this.getSharedAmount()
          );
        }

        this.assetUnitIn.setValue(+formatNumber(Number(max), 'en-US', '0.0-8'));
        this.assetUnitInHint = '';

        // this.assetTokenValueIn = assetToBase(assetAmount(this.assetUnitIn.value));
        this.assetTokenValueIn = Amount.fromAssetAmount(
          this.assetUnitIn.value,
          8
        );

        if (this.assetIn && this.assetIn.symbol !== this.rune) {
          this.getPoolDetails(this.assetIn.chain, this.assetIn.symbol, 'in');
        } else if (this.assetIn && this.assetIn.symbol === this.rune) {
          this.getPoolDetails(this.assetOut.chain, this.assetOut.symbol, 'out');
          this.updateSwapDetails();
        }
      }
    } else {
      if (this.investedRuneAmount) {
        this.inputValueComing({
          inputValue: this.getSharedAmount(),
          isRune: true,
          name: 'received',
        });
      }
    }
  }

  maximumSpendableBalance(asset: string, balance: number) {
    if (asset === 'BNB') {
      const max = balance - 0.01 - 0.000375;

      return balance;
      return max >= 0 ? max : 0;
    } else {
      return balance;
    }
  }

  withdraw() {
    const confirmTransactionRef =
      this.walletSendAsset.type == 'keystore'
        ? this.dialog.open(ConfirmKeystorePasswordComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { confirmed: this.showConfirm },
          })
        : this.dialog.open(ConfirmTransactionDialogComponent, {
            autoFocus: false,
            backdropClass: this.dialogBackdropColorClass,
            panelClass: this.dialogPanelClass,
            data: { confirmed: this.showConfirm },
          });

    confirmTransactionRef.afterClosed().subscribe((data) => {
      if (data.yes === true) {
        const user = this.user.filter(
          (u) => u.type == this.walletSendAsset.type
        )[0];
        let poolType: PoolTypeOption = 'SYM';
        if (this.asymAsset && this.asymRune && this.sym) {
          poolType = 'SYM';
        } else if (this.asymAsset && !this.asymRune && !this.sym) {
          poolType = 'ASYM_ASSET';
        } else if (!this.asymAsset && this.asymRune && !this.sym) {
          poolType = 'ASYM_RUNE';
        }
        const dialogRef = this.dialog.open<
          ConfirmWithdrawDialogComponent,
          ConfirmWithdrawData
        >(ConfirmWithdrawDialogComponent, {
          maxWidth: '420px',
          width: '50vw',
          minWidth: '310px',
          backdropClass: this.dialogBackdropColorClass,
          panelClass: this.dialogPanelClass,
          data: {
            asset: this.assetIn,
            rune: this.assetOut,
            assetAmount: this.assetUnitIn.value,
            runeAmount: this.assetUnitOut.value,
            user: user,
            unstakePercent: this.withdrawPercent,
            networkFee: this.networkFeeIn,
            runeFee: this.networkFeeOut,
            withdrawType: this.withdrawType,
            poolType: poolType,
          },
        });

        dialogRef.afterClosed().subscribe((transactionSuccess: boolean) => {
          consoleLog({ transactionSuccess });
          if (transactionSuccess) {
            this.withdrawPercent = 0;
          }
        });
      }
    });
  }

  clean() {
    this.showConfirm = false;
    this.assetUnitOut.setValue(0);
    this.assetUnitIn.setValue(0);
    this.assetIn = new Asset(this.assetIn.fullname);
    this.assetOut = new Asset('THOR.RUNE');
    //this.balanceIn = null;
    //this.balanceOut = null;

    this.assetUnitInHint = '';
  }

  toogleFeeDetails() {
    this.showFeeDetails = this.showFeeDetails == false ? true : false;
  }

  getSharedAmount(): number {
    let value = 0;
    const assetPool = this.originalPools.filter(
      (pool) => pool.asset.name == this.assetIn.fullname
    )[0];

    if (this.withdrawType == 'ASYM_ASSET') {
      value =
        this.investedAssetAmount +
        this.investedRuneAmount / +assetPool.asset_price;
    } else if (this.withdrawType == 'ASYM_RUNE') {
      value =
        this.investedRuneAmount +
        this.investedAssetAmount * +assetPool.asset_price;
    }

    this.asymBalance = value;

    return value;
  }

  setPercent(percent: number) {
    this.withdrawPercent = percent;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
