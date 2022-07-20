import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import WalletConnect from '@walletconnect/client';
//import WalletConnect from '@trustwallet/walletconnect';
import { MidgardService } from '@dexShared/services/midgard.service';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from '@dexShared/services/transaction-status.service';

import { SlippageToleranceService } from '@dexShared/services/slippage-tolerance.service';
import { BinanceService } from '@dexShared/services/binance.service';
import { TransactionConfirmationState } from '@dexShared/constants/transaction-confirmation-state';
import { PoolAddressDTO } from '@dexShared/classes/pool-address';
import { environment } from 'src/environments/environment';
import { TransferResult } from '@xchainjs/xchain-binance';
import { fromByteArray } from 'base64-js';

import { UserService } from '@dexShared/services/user.service';

import {
  baseAmount,
  assetToBase,
  assetAmount,
  Chain,
  assetToString,
  bn,
} from '@xchainjs/xchain-util';
import { Asset } from '@dexShared/classes/asset';
// import { Balance } from '@xchainjs/xchain-client';
import { EthUtilsService } from '@dexShared/services/eth-utils.service';
import { BigNumber as RealBig } from 'bignumber.js';
import { MockClientService } from '@services/mock-client.service';
import { User } from '@dexShared/classes/user';
import { Subscription } from 'rxjs';
import { Balance } from '@xchainjs/xchain-client';
import * as moment from 'moment';
import { consoleLog } from '@app/utils/consoles';
import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { decode, fromWords } from 'bech32';

export interface SwapData {
  type: string;
  sourceAsset: Asset;
  targetAsset: Asset;
  networkFeeIn: number;
  networkFeeOut: number;
  basePrice: number;
  inputValue: number;
  outputValue: number;
  sourceAddress: string;
  targetAddress: string;
  slip: number;
  balanceIn: RealBig;
  balanceOut: RealBig;
  user: User;
  isSP: boolean;
  spQty?: number;
}
const network = environment.network;
const defaultThorVersion = environment.defaultThorVersion;

@Component({
  selector: 'app-confirm-swap-dialog',
  templateUrl: './confirm-swap-dialog.component.html',
  styleUrls: ['./confirm-swap-dialog.component.scss'],
})
export class ConfirmSwapDialogComponent implements OnInit {
  public resultIcon: string; // cancel //check_circle
  public txState: TransactionConfirmationState;
  public hash: string;
  public walletConnector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
  });
  public environment: string;

  public binanceExplorerUrl: string;
  error: string;
  estimatedMinutes: {
    time: number;
  };
  balances: Balance[];
  subs: Subscription[];
  public dcf_networkPath = defaultThorVersion + '_' + network;
  public SPcounter = 0;

  public language: string;
  public translation: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ConfirmSwapDialogComponent>,
    private slipLimitService: SlippageToleranceService,
    private txStatusService: TransactionStatusService,
    private binanceService: BinanceService,
    private midgardService: MidgardService,
    private ethUtilsService: EthUtilsService,
    private mockClientService: MockClientService,
    private userService: UserService,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    /*let networkPath = localStorage.getItem('dcf-network');
    if (networkPath == null) {
      localStorage.setItem('dcf-network', this.dcf_networkPath);
    } else {
      this.dcf_networkPath = networkPath;
    }*/
    //this.dcf_networkPath = localStorage.getItem('dcf-network');
    /*this.binanceExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org/'
        : 'https://explorer.binance.org/';*/
    this.binanceExplorerUrl = 'https://viewblock.io/thorchain/tx/';
    this.environment =
      this.dcf_networkPath == 'multichain_testnet' ? 'testnet' : 'chaosnet';

    const user$ = this.userService.user$.subscribe((user) => {
      if (!user && this.swapData.type != 'walletconnect') {
        consoleLog('NO USER!!!!');
        this.closeDialog();
      }
    });

    const balances$ = this.userService.userBalances$.subscribe((balances) => {
      this.balances = balances;
    });

    this.subs = [balances$, user$];
  }

  ngOnInit() {
    this.estimateTime();
    this.submitTransaction();

    this.masterWalletManagerService.language$.subscribe((lang) => {
      this.language = lang.toUpperCase();
      this.translate.use(lang);
      this.translate.get('operations').subscribe((res: string) => {
        this.translation = res;
      });
    });
  }

  async estimateTime() {
    if (
      this.swapData.sourceAsset.chain === 'ETH' &&
      this.swapData.sourceAsset.symbol !== 'ETH'
    ) {
      this.estimatedMinutes.time = await this.ethUtilsService.estimateERC20Time(
        assetToString(this.swapData.sourceAsset),
        this.swapData.inputValue
      );
    } else {
      this.estimatedMinutes.time = this.txStatusService.estimateTime(
        this.swapData.sourceAsset.chain,
        this.swapData.inputValue
      );
    }
  }

  submitTransaction() {
    this.txState = TransactionConfirmationState.SUBMITTING;

    // Source asset is not RUNE
    if (
      this.swapData.sourceAsset.chain === 'BNB' ||
      this.swapData.sourceAsset.chain === 'BTC' ||
      this.swapData.sourceAsset.chain === 'ETH' ||
      this.swapData.sourceAsset.chain === 'LTC' ||
      this.swapData.sourceAsset.chain === 'BCH' ||
      this.swapData.sourceAsset.chain === 'DOGE'
    ) {
      this.midgardService.getInboundAddresses().subscribe(async (res) => {
        const currentPools = res;

        if (currentPools && currentPools.length > 0) {
          const matchingPool = currentPools.find(
            (pool) => pool.chain === this.swapData.sourceAsset.chain
          );

          if (matchingPool) {
            if (
              this.swapData.type === 'keystore' ||
              this.swapData.type === 'xdefi' ||
              this.swapData.type === 'ledger'
            ) {
              this.keystoreTransfer(matchingPool);
            } else if (this.swapData.type === 'walletconnect') {
              this.walletConnectTransfer(matchingPool);
            } else {
              consoleLog('no error type matches');
            }
          } else {
            consoleLog('no matching pool found');
          }
        } else {
          consoleLog('no current pools found...');
        }
      });
    } else {
      // RUNE is source asset
      if (this.swapData.type === 'walletconnect') {
        this.walletConnectTransfer();
      } else {
        this.keystoreTransfer();
      }
    }
  }

  validateTargetAddress(): boolean {
    const chain = this.swapData.targetAsset.chain;

    const client = this.getChainClient(chain);

    if (!client) {
      return false;
    }

    return client.validateAddress(this.swapData.targetAddress);
  }

  getChainClient(chain: string) {
    switch (chain) {
      case 'BTC':
        //return this.mockClientService.mockBtcClient;
        return this.swapData.user.clients.bitcoin;

      case 'ETH':
        //return this.mockClientService.mockEthereumClient;
        return this.swapData.user.clients.ethereum;

      case 'BNB':
        //return this.mockClientService.mockBinanceClient;
        return this.swapData.user.clients.binance;

      case 'BCH':
        //return this.mockClientService.mockBchClient;
        return this.swapData.user.clients.bitcoinCash;

      case 'LTC':
        //return this.mockClientService.mockLtcClient;
        return this.swapData.user.clients.litecoin;

      case 'DOGE':
        //return this.mockClientService.mockDogeClient;
        return this.swapData.user.clients.dogecoin;

      case 'THOR':
        //return this.mockClientService.mockThorchainClient;
        return this.swapData.user.clients.thorchain;
    }

    throw new Error(`no matching client for chain: ${chain}`);
  }

  async keystoreTransfer(matchingPool?: PoolAddressDTO) {
    const binanceClient = this.swapData.user.clients.binance;
    const bitcoinClient = this.swapData.user.clients.bitcoin;
    const thorClient = this.swapData.user.clients.thorchain;
    const ethClient = this.swapData.user.clients.ethereum;
    const litecoinClient = this.swapData.user.clients.litecoin;
    const btcCashClient = this.swapData.user.clients.bitcoinCash;
    const dogeClient = this.swapData.user.clients.dogecoin;

    // Check of `validateSwap` before makes sure that we have a valid number here
    const amountNumber = this.swapData.inputValue;

    /*if (this.swapData.user.type === 'ledger') {
      bncClient.useLedgerSigningDelegate(
        this.swapData.user.ledger,
        () => this.txState = TransactionConfirmationState.PENDING_LEDGER_CONFIRMATION,
        () => this.txState = TransactionConfirmationState.SUBMITTING,
        (err) => consoleLog('error: ', err),
        this.swapData.user.hdPath
      );
    }*/

    // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
    if (this.swapData.sourceAsset.chain == 'BTC') {
      this.slipLimitService.setSlippageTolerance(5);
    }
    const floor = this.swapData.isSP
      ? this.slipLimitService.getSlipLimitFromAmount(
          this.swapData.outputValue / this.swapData.spQty
        )
      : this.slipLimitService.getSlipLimitFromAmount(this.swapData.outputValue);

    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      this.swapData.targetAddress,
      Math.floor(floor.toNumber())
    );

    if (!memo || memo === '') {
      this.error = 'Error creating tx memo';
      this.txState = TransactionConfirmationState.ERROR;
      this.resultIcon = 'cancel';
      return;
    }

    if (!this.validateTargetAddress()) {
      this.error = `Invalid ${this.swapData.targetAsset.chain} Address`;
      this.txState = TransactionConfirmationState.ERROR;
      this.resultIcon = 'cancel';
      return;
    }

    if (this.swapData.sourceAsset.chain === 'THOR') {
      try {
        const sendAmount = this.addSPDecimals(amountNumber);
        consoleLog(this.SPcounter, amountNumber, sendAmount, {
          asset: this.swapData.sourceAsset,
          amount: assetToBase(assetAmount(sendAmount)),
          memo,
        });
        const hash = await thorClient.deposit({
          asset: this.swapData.sourceAsset,
          amount: assetToBase(assetAmount(sendAmount)),
          memo,
        });

        this.hash = hash;
        this.executeSPTxs();
        const time = moment().format('YYYY-MM-DD HH:mm:ss');

        this.txStatusService.addTransaction({
          chain: Chain.THORChain,
          hash: this.hash,
          ticker: this.swapData.sourceAsset.ticker,
          status: TxStatus.PENDING,
          action: TxActions.SWAP,
          isThorchainTx: true,
          symbol: this.swapData.sourceAsset.symbol,
          assetAmount: this.swapData.inputValue,
          out_asset: this.swapData.targetAsset.fullname,
          out_amount: this.swapData.outputValue,
          time: time,
        });
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        console.error(error.stack);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.swapData.sourceAsset.chain === 'BNB') {
      try {
        const hash = await binanceClient.transfer({
          asset: this.swapData.sourceAsset,
          amount: assetToBase(assetAmount(this.addSPDecimals(amountNumber))),
          recipient: matchingPool.address,
          memo,
        });

        this.hash = hash;
        this.executeSPTxs();
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.swapData.sourceAsset.chain === 'DOGE') {
      try {
        const hash = await dogeClient.transfer({
          asset: this.swapData.sourceAsset,
          amount: assetToBase(assetAmount(this.addSPDecimals(amountNumber))),
          recipient: matchingPool.address,
          memo,
        });

        this.hash = hash;
        this.executeSPTxs();
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.swapData.sourceAsset.chain === 'BTC') {
      try {
        // TODO -> consolidate this with BTC, BCH, LTC

        const balanceAmount = this.swapData.balanceIn;

        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.swapData.networkFeeIn));
        const amount = balanceAmount
          // subtract fee
          .minus(feeToBase.amount())
          // subtract amount
          .minus(toBase.amount())
          .isGreaterThan(0)
          ? toBase.amount() // send full amount, fee can be deducted from remaining balance
          : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

        if (amount.isLessThan(0)) {
          this.error = 'Insufficient funds. Try sending a smaller amount';
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
          return;
        }
        // TODO -> consolidate this with BTC, BCH, LTC

        // if (memo.length > 80) {
        //   this.error =
        //     'Memo exceeds 80. Report to https://gitlab.com/turpialdev/defibots/light_dashboard/issues.';
        //   this.txState = TransactionConfirmationState.ERROR;
        //   this.resultIcon = 'cancel';
        //   return;
        // }

        const hash = await bitcoinClient.transfer({
          amount: baseAmount(bn(this.addSPDecimals(amount.toNumber()))),
          recipient: matchingPool.address,
          memo,
          feeRate: +matchingPool.gas_rate,
          asset: this.swapData.sourceAsset,
        });

        this.hash = hash;
        this.executeSPTxs();
        this.pushTxStatus(hash, this.swapData.sourceAsset);

        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
        consoleLog(TransactionConfirmationState.SUCCESS);
      } catch (error: any) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.swapData.sourceAsset.chain === 'ETH') {
      try {
        const sourceAsset = this.swapData.sourceAsset;

        const decimal = await this.ethUtilsService.getAssetDecimal(
          this.swapData.sourceAsset,
          ethClient
        );
        let amount = assetToBase(
          assetAmount(this.swapData.inputValue, decimal)
        ).amount();
        const balanceAmount = this.swapData.balanceIn;

        if (amount.isGreaterThan(balanceAmount)) {
          amount = balanceAmount;
        }

        /*const hash = await this.ethUtilsService.callDeposit({
          inboundAddress: matchingPool,
          asset: sourceAsset,
          memo: memo,
          amount,
          ethClient,
        });*/

        //FOR KEYSTORE
        const hash = await ethClient.transfer({
          amount: assetToBase(
            assetAmount(this.addSPDecimals(amountNumber) * 10000000000)
          ),
          recipient: matchingPool.address,
          memo,
          asset: this.swapData.sourceAsset,
        });

        //this.hash = hash.substr(2);
        this.hash = hash;
        this.executeSPTxs();
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        console.error(error.stack);
        this.error =
          'ETH swap failed. Please try again using a smaller amount.';
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.swapData.sourceAsset.chain === 'LTC') {
      try {
        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.swapData.balanceIn;

        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.swapData.networkFeeIn));
        const amount = amountNumber;
        // const amount = balanceAmount
        //   // subtract fee
        //   .minus(feeToBase.amount())
        //   // subtract amount
        //   .minus(toBase.amount())
        //   .isGreaterThan(0)
        //   ? toBase.amount() // send full amount, fee can be deducted from remaining balance
        //   : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

        // if (amount.isLessThan(0)) {
        //   this.error = 'Insufficient funds. Try sending a smaller amount';
        //   this.txState = TransactionConfirmationState.ERROR;
        //   this.resultIcon = 'cancel';
        //   return;
        // }
        // TODO -> consolidate this with BTC, BCH, LTC

        // if (memo.length > 80) {
        //   this.error =
        //     'Memo exceeds 80. Report to https://gitlab.com/turpialdev/defibots/light_dashboard/issues.';
        //   this.txState = TransactionConfirmationState.ERROR;
        //   this.resultIcon = 'cancel';
        //   return;
        // }

        consoleLog({
          amount: assetToBase(assetAmount(amount)),
          amountnumber: amount,
          recipient: matchingPool.address,
          memo,
        });
        const hash = await litecoinClient.transfer({
          amount: assetToBase(assetAmount(amount)),
          recipient: matchingPool.address,
          memo,
        });

        this.hash = hash;
        this.executeSPTxs();
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.swapData.sourceAsset.chain === 'BCH') {
      try {
        const bchClient = btcCashClient;

        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.swapData.balanceIn;

        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.swapData.networkFeeIn));
        const amount = this.swapData.inputValue;
        // const amount = balanceAmount
        //   // subtract fee
        //   .minus(feeToBase.amount())
        //   // subtract amount
        //   .minus(toBase.amount())
        //   .isGreaterThan(0)
        //   ? toBase.amount() // send full amount, fee can be deducted from remaining balance
        //   : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

        if (amount < 0) {
          this.error = 'Insufficient funds. Try sending a smaller amount';
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
          return;
        }
        // end TODO

        console.log(assetAmount(amount).decimal, {
          amountnum: amount,
          assetamount: assetAmount(amount).amount().toNumber(),
          amount: assetToBase(assetAmount(amount)).amount().toNumber(),
          amounttype: assetToBase(assetAmount(amount)),
          // amount1: amount.toNumber() / 10 ** 8,
          // amount2: baseAmount(amount).amount().toNumber(),
          // amountproove: assetToBase(assetAmount(0.01)).amount().toNumber(),

          recipient: matchingPool.address,
          memo,
          feeRate: +matchingPool.gas_rate,
          bchClient: bchClient.getAddress(),
        });

        const hash = await bchClient.transfer({
          amount: assetToBase(assetAmount(amount)),
          recipient: matchingPool.address,
          memo,
        });

        // const hash = await bchClient.deposit({
        //   amount: assetToBase(assetAmount(amount,0)),
        //   memo,
        //   asset: new Asset('BCH.BCH')
        // })

        consoleLog({ hashbch: hash });

        this.hash = hash;
        this.executeSPTxs();
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    }
  }

  pushTxStatus(hash: string, asset: Asset) {
    const time = moment().format('YYYY-MM-DD HH:mm:ss');

    this.txStatusService.addTransaction({
      chain: asset.chain,
      ticker: asset.ticker,
      status: TxStatus.PENDING,
      action: TxActions.SWAP,
      isThorchainTx: true,
      symbol: asset.symbol,
      hash,
      assetAmount: this.swapData.inputValue,
      out_asset: this.swapData.targetAsset.fullname,
      out_amount: this.swapData.isSP
        ? this.swapData.outputValue / this.swapData.spQty
        : this.swapData.outputValue,
      time: time,
    });
  }

  walletConnectTransfer(matchingPool?: PoolAddressDTO) {
    const floor = this.slipLimitService.getSlipLimitFromAmount(
      this.swapData.outputValue
    );

    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      this.swapData.targetAddress,
      Math.floor(floor.toNumber())
    );

    if (this.swapData.sourceAsset.chain == 'BNB') {
      const coins = [
        {
          denom: this.swapData.sourceAsset.symbol,
          amount: assetToBase(assetAmount(this.swapData.inputValue))
            .amount()
            .toNumber(),
        },
      ];

      const sendOrder = this.walletConnectGetSendOrderMsg({
        fromAddress: this.swapData.targetAddress,
        toAddress: matchingPool.address,
        coins,
      });

      const bncClient = this.binanceService.bncClient;

      bncClient
        .getAccount(this.swapData.sourceAddress)
        .then(async (response) => {
          if (!response) {
            console.error('no response getting account:', response);
            return;
          }

          const account = response.result;
          const chainId =
            this.dcf_networkPath === 'multichain_testnet'
              ? 'Binance-Chain-Nile'
              : 'Binance-Chain-Tigris';

          const tx = {
            accountNumber: account.account_number.toString(),
            sequence: account.sequence.toString(),
            send_order: sendOrder,
            from: this.swapData.sourceAddress,
            to: matchingPool.address,
            chainId,
            memo,
          };

          /*const tx = {
          from: this.swapData.sourceAddress,
          to: matchingPool.address,
          data: '',
        };*/

          const res = await this.walletConnectSendTx(tx, bncClient, memo);

          if (res) {
            this.txState = TransactionConfirmationState.SUCCESS;

            this.resultIcon = 'check_circle';

            if (res.result && res.result.length > 0) {
              this.hash = res.result[0].hash;
            }
          }
        })
        .catch((error) => {
          console.error('getAccount error: ', error);
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        });
    } else if (this.swapData.sourceAsset.chain == 'ETH') {
      const ethereumClient = this.mockClientService.mockEthereumClient;
      ethereumClient.getAddress = () => this.swapData.sourceAddress;

      const tx = {
        from: this.swapData.sourceAddress,
        to: matchingPool.address,
        memo,
      };
      const res = this.walletConnectSendTx(tx, ethereumClient, memo)
        .then((result) => {
          this.txState = TransactionConfirmationState.SUCCESS;

          this.resultIcon = 'check_circle';

          if (result.result && result.result.length > 0) {
            this.hash = result.result[0].hash;
          }
        })
        .catch((error) => {
          console.error('trustSignTransaction error: ', error);
        });
    } else if (this.swapData.sourceAsset.chain == 'THOR') {
      const thorClient = this.mockClientService.mockThorchainClient;
      thorClient.getAddress = () => this.swapData.sourceAddress;
      thorClient
        .getBalance(this.swapData.sourceAddress)
        .then((result) => consoleLog(result[0].asset));

      /*let txParams = {
          walletIndex:0
          asset:{
            chain
          }
        }
        thorClient.transfer();*/

      const tx = {
        from: this.swapData.sourceAddress,
        to: memo,
      };

      const res = this.walletConnectSendTx(tx, thorClient, memo)
        .then((result) => {
          this.txState = TransactionConfirmationState.SUCCESS;

          this.resultIcon = 'check_circle';

          if (result.result && result.result.length > 0) {
            this.hash = result.result[0].hash;
          }
        })
        .catch((error) => {
          console.error('trustSignTransaction error: ', error);
        });
    }
  }

  walletConnectSendTx(tx, client, memo): Promise<TransferResult> {
    if (this.swapData.sourceAsset.chain == 'BNB') {
      const msgParams = [
        JSON.stringify(tx), // Required
        this.swapData.sourceAddress, // Required
      ];
      return new Promise((resolve, reject) => {
        this.walletConnector
          .signPersonalMessage(msgParams)
          .then((result) => {
            client
              .transfer(
                this.swapData.sourceAddress,
                this.swapData.targetAddress,
                this.swapData.inputValue,
                this.swapData.sourceAsset.ticker,
                memo,
                tx.sequence
              )
              .then((response: any) => {
                resolve(response);
              })
              .catch((error: any) => {
                reject(error);
              });
          })
          .catch((error: any) => {
            console.error('trustSignTransaction error: ', error);
            reject(error);
          });
      });
    } else if (this.swapData.sourceAsset.chain == 'THOR') {
      const msgParams = [
        JSON.stringify(tx), // Required
        this.swapData.sourceAddress, // Required
      ];
      return new Promise((resolve, reject) => {
        this.walletConnector
          .signPersonalMessage(msgParams)
          .then((result) => {
            return resolve(result);
            /*client.transfer = async (transferParams) => {
              consoleLog(transferParams);
            };
            const hash = client.deposit({
              amount: assetToBase(assetAmount(this.swapData.inputValue)),
              memo,
            });
            consoleLog(hash);*/
          })
          .catch((error: any) => {
            console.error('trustSignTransaction error: ', error);
            reject(error);
          });
      });
    } else if (this.swapData.sourceAsset.chain == 'ETH') {
      const txParams = {
        from: tx.from, // Required
        to: tx.to, // Required (for non contract deployments)
        data: '0x', // Required
      };
      return new Promise((resolve, reject) => {
        this.walletConnector
          .sendTransaction(txParams)
          .then((result) => {
            return resolve(result);
            /*client.transfer = async (transferParams) => {
              consoleLog(transferParams);
            };
            const hash = client.deposit({
              amount: assetToBase(assetAmount(this.swapData.inputValue)),
              memo,
            });
            consoleLog(hash);*/
          })
          .catch((error: any) => {
            console.error('trustSignTransaction error: ', error);
            return reject(error);
          });
      });
    }
  }

  toHex(str: string) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
  }

  walletConnectGetSendOrderMsg({
    fromAddress,
    toAddress,
    coins: coinData,
  }: any) {
    // 1. sort denoms by alphabet order
    // 2. validate coins with zero amounts
    const coins = coinData
      .sort((a: any, b: any) => a.denom.localeCompare(b.denom))
      .filter((data: any) => {
        return data.amount > 0;
      });

    // if coin data is invalid, return null
    if (!coins.length) {
      return null;
    }

    const msg = {
      /*inputs: [
        {
          address: this.getByteArrayFromAddress(fromAddress),
          coins,
        },
      ],
      outputs: [
        {
          address: this.getByteArrayFromAddress(toAddress),
          coins,
        },
      ],*/
    };

    return msg;
  }

  getByteArrayFromAddress(address: string) {
    const decodeAddress = decode(address);
    return fromByteArray(Buffer.from(fromWords(decodeAddress.words)));
  }

  getSwapMemo(chain: string, symbol: string, addr: string, sliplimit: number) {
    //return `SWAP:${chain}.${symbol}:${addr}:${sliplimit}:tbnb1rl3rlyafsd6ns6rf2q7zat9nws0we5c7ev9n6g:10`;
    const tag =
      this.swapData.type && this.swapData.type === 'xdefi'
        ? `33${this.SPcounter}`
        : `44${this.SPcounter}`;

    if (chain === 'ETH' && symbol !== 'ETH') {
      const ticker = symbol.split('-')[0];
      const trimmedAddress = symbol.substring(symbol.length - 3);
      symbol = `${ticker}-${trimmedAddress.toUpperCase()}`;
    }

    const localNetwork = localStorage.getItem('dcf-network');
    let affiliateAddress = '';
    if (localNetwork == 'multichain_chaosnet') {
      affiliateAddress = 'thor198d7hmxx9xptw8w3vswys30ss074selch3jw2p';
    } else if (localNetwork == 'multichain_testnet') {
      affiliateAddress = 'tthor1z68sfsa59clf8scu2w3g9l8tfjktukzkcjnmf9';
    } else {
      affiliateAddress =
        environment.network === 'testnet'
          ? 'tthor1z68sfsa59clf8scu2w3g9l8tfjktukzkcjnmf9'
          : 'thor198d7hmxx9xptw8w3vswys30ss074selch3jw2p';
    }

    const affieliateBPFee = '0';

    if (sliplimit && sliplimit.toString().length > 3) {
      const taggedSlip =
        sliplimit.toString().slice(0, sliplimit.toString().length - 3) + tag;
      // return `=:${chain}.${symbol}:${addr}:${taggedSlip}`;
      return `=:${chain}.${symbol}:${addr}:${taggedSlip}:${affiliateAddress}:${affieliateBPFee}`;
    } else {
      // return `=:${chain}.${symbol}:${addr}:${sliplimit}`;
      return `=:${chain}.${symbol}:${addr}:${sliplimit}:${affiliateAddress}:${affieliateBPFee}`;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  executeSPTxs() {
    const time = this.swapData.sourceAsset.chain == 'THOR' ? 5000 : 1000;
    this.SPcounter = this.SPcounter + 1;
    if (this.swapData.isSP == true && this.SPcounter <= this.swapData.spQty) {
      setTimeout(() => {
        this.submitTransaction();
      }, time);
    }
  }

  addSPDecimals(amount: number): number {
    let amountToStr: string = amount.toString();
    if (this.swapData.isSP == true && this.SPcounter < this.swapData.spQty) {
      amountToStr = amountToStr + this.SPcounter.toString();
    }
    consoleLog(amount, amountToStr, +amountToStr);
    return +amountToStr;
  }
}
