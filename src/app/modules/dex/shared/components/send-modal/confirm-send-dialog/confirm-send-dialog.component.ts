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

//import { SlippageToleranceService } from '@dexShared/services/slippage-tolerance.service';
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
  // assetToString,
  Chain,
  assetToString,
  // bn,
} from '@xchainjs/xchain-util';
import { Asset } from '@dexShared/classes/asset';
// import { Balance } from '@xchainjs/xchain-client';
import { EthUtilsService } from '@dexShared/services/eth-utils.service';
import { BigNumber } from 'bignumber.js';
import { MockClientService } from '@services/mock-client.service';
import { User } from '@dexShared/classes/user';
import { Subscription } from 'rxjs';
import { Balance, FeeOption } from '@xchainjs/xchain-client';
import { consoleLog } from '@app/utils/consoles';

import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

import { decode, fromWords } from 'bech32';

export interface ConfirmSendData {
  type: string;
  sourceAsset: Asset;
  networkFeeIn: number;
  inputValue: number;
  targetAddress: string;
  memo: string;
  balanceIn: BigNumber;
  user: User;
}

@Component({
  selector: 'app-confirm-send-dialog',
  templateUrl: './confirm-send-dialog.component.html',
  styleUrls: ['./confirm-send-dialog.component.scss'],
})
export class ConfirmSendDialogComponent implements OnInit {
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

  public language: string;
  public translation: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public sendData: ConfirmSendData,
    public dialogRef: MatDialogRef<ConfirmSendDialogComponent>,
    //private slipLimitService: SlippageToleranceService,
    private txStatusService: TransactionStatusService,
    private binanceService: BinanceService,
    private midgardService: MidgardService,
    private ethUtilsService: EthUtilsService,
    private mockClientService: MockClientService,
    private userService: UserService,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    /*this.binanceExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org/'
        : 'https://explorer.binance.org/';*/
    this.binanceExplorerUrl = 'https://viewblock.io/thorchain/tx/';
    this.environment =
      environment.network === 'testnet' ? 'testnet' : 'chaosnet';

    const user$ = this.userService.user$.subscribe((user) => {
      if (!user) {
        consoleLog('NO USER!!!!');
        this.closeDialog();
      }
    });

    const balances$ = this.userService.userBalances$.subscribe((balances) => {
      this.balances = balances;
      consoleLog({ balances });
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
      this.sendData.sourceAsset.chain === 'ETH' &&
      this.sendData.sourceAsset.symbol !== 'ETH'
    ) {
      this.estimatedMinutes.time = await this.ethUtilsService.estimateERC20Time(
        assetToString(this.sendData.sourceAsset),
        this.sendData.inputValue
      );
    } else {
      this.estimatedMinutes.time = this.txStatusService.estimateTime(
        this.sendData.sourceAsset.chain,
        this.sendData.inputValue
      );
    }
  }

  submitTransaction() {
    this.txState = TransactionConfirmationState.SUBMITTING;

    // Source asset is not RUNE
    if (
      this.sendData.sourceAsset.chain === 'BNB' ||
      this.sendData.sourceAsset.chain === 'BTC' ||
      this.sendData.sourceAsset.chain === 'ETH' ||
      this.sendData.sourceAsset.chain === 'LTC' ||
      this.sendData.sourceAsset.chain === 'BCH'
    ) {
      this.midgardService.getInboundAddresses().subscribe(async (res) => {
        const currentPools = res;

        if (currentPools && currentPools.length > 0) {
          const matchingPool = currentPools.find(
            (pool) => pool.chain === this.sendData.sourceAsset.chain
          );

          if (matchingPool) {
            if (
              this.sendData.type === 'keystore' ||
              this.sendData.type === 'xdefi' ||
              this.sendData.type === 'ledger'
            ) {
              this.keystoreTransfer(matchingPool);
            } else if (this.sendData.type === 'walletconnect') {
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
      this.keystoreTransfer();
    }
  }

  validateTargetAddress(): boolean {
    const chain = this.sendData.sourceAsset.chain;

    const client = this.getChainClient(chain);

    if (!client) {
      return false;
    }

    return client.validateAddress(this.sendData.targetAddress);
  }

  getChainClient(chain: string) {
    switch (chain) {
      case 'BTC':
        return this.mockClientService.mockBtcClient;

      case 'ETH':
        return this.mockClientService.mockEthereumClient;

      case 'BNB':
        return this.mockClientService.mockBinanceClient;

      case 'BCH':
        return this.mockClientService.mockBchClient;

      case 'LTC':
        return this.mockClientService.mockLtcClient;

      case 'DOGE':
        return this.mockClientService.mockDogeClient;

      case 'THOR':
        return this.mockClientService.mockThorchainClient;
    }

    throw new Error(`no matching client for chain: ${chain}`);
  }

  async keystoreTransfer(matchingPool?: PoolAddressDTO) {
    const binanceClient = this.sendData.user.clients.binance;
    const bitcoinClient = this.sendData.user.clients.bitcoin;
    const thorClient = this.sendData.user.clients.thorchain;
    const ethClient = this.sendData.user.clients.ethereum;
    const litecoinClient = this.sendData.user.clients.litecoin;
    const btcCashClient = this.sendData.user.clients.bitcoinCash;
    const dogeClient = this.sendData.user.clients.dogecoin;

    // Check of `validateSwap` before makes sure that we have a valid number here
    const amountNumber = this.sendData.inputValue;

    /*if (this.sendData.user.type === 'ledger') {
      bncClient.useLedgerSigningDelegate(
        this.sendData.user.ledger,
        () => this.txState = TransactionConfirmationState.PENDING_LEDGER_CONFIRMATION,
        () => this.txState = TransactionConfirmationState.SUBMITTING,
        (err) => consoleLog('error: ', err),
        this.sendData.user.hdPath
      );
    }*/

    // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';

    const memo = this.sendData.memo;

    if (this.sendData.sourceAsset.chain === 'THOR') {
      consoleLog('confirm send', {
        asset: this.sendData.sourceAsset,
        amount: assetToBase(assetAmount(amountNumber)).amount().toNumber(),
        recipient: this.sendData.targetAddress,
        memo,
      });
      try {
        const hash = await thorClient.transfer({
          asset: this.sendData.sourceAsset,
          amount: assetToBase(assetAmount(amountNumber)),
          recipient: this.sendData.targetAddress,
          memo,
        });
        // const hash = await thorClient.deposit({
        //   asset: this.sendData.sourceAsset,
        //   amount: assetToBase(assetAmount(amountNumber)),
        //   memo,
        // });

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: Chain.THORChain,
          hash: this.hash,
          ticker: this.sendData.sourceAsset.ticker,
          status: TxStatus.COMPLETE,
          action: TxActions.SEND,
          isThorchainTx: true,
          symbol: this.sendData.sourceAsset.symbol,
          assetAmount: this.sendData.inputValue,
          out_asset: this.sendData.sourceAsset.ticker,
          out_amount: this.sendData.inputValue,
        });
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error) {
        if (error instanceof Error) {
          console.error('error making transfer: ', error);
          console.error(error.stack);
          this.error = error.message;
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        }
      }
    } else if (this.sendData.sourceAsset.chain === 'BNB') {
      try {
        const hash = await binanceClient.transfer({
          asset: this.sendData.sourceAsset,
          amount: assetToBase(assetAmount(amountNumber)),
          recipient: this.sendData.targetAddress,
          memo,
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.sendData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error) {
        if (error instanceof Error) {
          console.error('error making transfer: ', error);
          this.error = error.message;
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        }
      }
    } else if (this.sendData.sourceAsset.chain === 'DOGE') {
      try {
        const hash = await dogeClient.transfer({
          asset: this.sendData.sourceAsset,
          amount: assetToBase(assetAmount(amountNumber)),
          recipient: this.sendData.targetAddress,
          memo,
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.sendData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error: any) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } else if (this.sendData.sourceAsset.chain === 'BTC') {
      try {
        // TODO -> consolidate this with BTC, BCH, LTC

        const balanceAmount = this.sendData.balanceIn;

        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.sendData.networkFeeIn));
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

        const hash = await bitcoinClient.transfer({
          amount: baseAmount(amount),
          recipient: this.sendData.targetAddress,
          memo,
          feeRate: +matchingPool.gas_rate,
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.sendData.sourceAsset);

        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
        consoleLog(TransactionConfirmationState.SUCCESS);
      } catch (error) {
        if (error instanceof Error) {
          console.error('error making transfer: ', error);
          this.error = error.message;
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        }
      }
    } else if (this.sendData.sourceAsset.chain === 'ETH') {
      try {
        /*const sourceAsset = this.sendData.sourceAsset;

        const decimal = await this.ethUtilsService.getAssetDecimal(
          this.sendData.sourceAsset,
          ethClient
        );*/
        /*let amount = assetToBase(
          assetAmount(this.sendData.inputValue, decimal)
        ).amount();
        const balanceAmount = this.sendData.balanceIn;

        if (amount.isGreaterThan(balanceAmount)) {
          amount = balanceAmount;
        }*/

        //FORCE SETTING MANUAL RECIPIENT INSTEAD OF THORCHAIN CONTRACT
        //matchingPool.address = this.sendData.targetAddress;

        /*const hash = await this.ethUtilsService.callDeposit({
          inboundAddress: matchingPool,
          asset: sourceAsset,
          memo: memo,
          amount,
          ethClient,
        });*/

        const hash = await ethClient.transfer({
          asset: this.sendData.sourceAsset,
          amount: assetToBase(assetAmount(amountNumber * 10000000000)),
          recipient: this.sendData.targetAddress,
          memo,
          feeOption: FeeOption.Average,
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.sendData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error) {
        if (error instanceof Error) {
          console.error('error making transfer: ', error);
          console.error(error.stack);
          this.error =
            'ETH swap failed. Please try again using a smaller amount.';
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        }
      }
    } else if (this.sendData.sourceAsset.chain === 'LTC') {
      try {
        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.sendData.balanceIn;

        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.sendData.networkFeeIn));
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

        const hash = await litecoinClient.transfer({
          amount: baseAmount(amount),
          recipient: this.sendData.targetAddress,
          memo,
          feeRate: +matchingPool.gas_rate,
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.sendData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error) {
        console.error('error making transfer: ', error);
        if (error instanceof Error) {
          this.error = error.message;
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        }
      }
    } else if (this.sendData.sourceAsset.chain === 'BCH') {
      try {
        const bchClient = btcCashClient;

        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.sendData.balanceIn;

        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.sendData.networkFeeIn));
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
        // end TODO

        const hash = await bchClient.transfer({
          amount: baseAmount(amount),
          recipient: this.sendData.targetAddress,
          memo,
          //feeRate: +matchingPool.gas_rate,
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.sendData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
        this.resultIcon = 'check_circle';
      } catch (error) {
        console.error('error making transfer: ', error);
        if (error instanceof Error) {
          this.error = error.message;
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
        }
      }
    }
  }

  pushTxStatus(hash: string, asset: Asset) {
    this.txStatusService.addTransaction({
      chain: asset.chain,
      ticker: asset.ticker,
      status: TxStatus.COMPLETE,
      action: TxActions.SEND,
      isThorchainTx: false,
      symbol: asset.symbol,
      hash,
      assetAmount: this.sendData.inputValue,
      out_asset: this.sendData.sourceAsset.ticker,
      out_amount: this.sendData.inputValue,
    });
  }

  walletConnectTransfer(matchingPool: PoolAddressDTO) {
    // const coins = [
    //   {
    //     denom: this.sendData.sourceAsset.symbol,
    //     amount: assetToBase(assetAmount(this.sendData.inputValue))
    //       .amount()
    //       .toNumber(),
    //   },
    // ];

    // const sendOrder = this.walletConnectGetSendOrderMsg({
    //   fromAddress: this.sendData.targetAddress,
    //   toAddress: matchingPool.address,
    //   coins,
    // });

    // const floor = this.slipLimitService.getSlipLimitFromAmount(
    //   this.sendData.inputValue
    // );

    // const memo = this.getSwapMemo(
    //   this.sendData.sourceAsset.chain,
    //   this.sendData.sourceAsset.symbol,
    //   this.sendData.targetAddress,
    //   Math.floor(floor.toNumber())
    // );

    const bncClient = this.binanceService.bncClient;

    bncClient
      .getAccount(this.sendData.targetAddress)
      .then(async (response) => {
        consoleLog(response);

        if (!response) {
          console.error('no response getting account:', response);
          return;
        }

        const account = response.result;
        // const chainId =
        //   environment.network === 'testnet'
        //     ? 'Binance-Chain-Nile'
        //     : 'Binance-Chain-Tigris';
        /*const tx = {
          accountNumber: account.account_number.toString(),
          sequence: account.sequence.toString(),
          send_order: sendOrder,
          chainId,
          memo,
        };*/

        const tx = {
          from: account.account_number.toString(),
          to: matchingPool.address,
          data: '',
        };

        const res = await this.walletConnectSendTx(tx, bncClient);

        if (res) {
          this.txState = TransactionConfirmationState.SUCCESS;

          this.resultIcon = 'check_circle';

          if (res.result && res.result.length > 0) {
            this.hash = res.result[0].hash;
            consoleLog(this.hash);
          }
        }
      })
      .catch((error) => {
        console.error('getAccount error: ', error);
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      });
  }

  walletConnectSendTx(tx, bncClient): Promise<TransferResult> {
    // const NETWORK_ID = 714;

    /*return new Promise( (resolve, reject) => {
      this.walletConnector
      .trustSignTransaction(NETWORK_ID, tx)
      .then((result) => {

        bncClient
          .sendRawTransaction(result, true)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        console.error('trustSignTransaction error: ', error);
        reject(error);
      });
    });*/

    return new Promise((resolve, reject) => {
      this.walletConnector
        .signTransaction(tx)
        .then((result) => {
          bncClient
            .sendRawTransaction(result, true)
            .then((response) => {
              resolve(response);
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          console.error('trustSignTransaction error: ', error);
          reject(error);
        });
    });
  }

  walletConnectGetSendOrderMsg({ fromAddress, toAddress, coins: coinData }) {
    // 1. sort denoms by alphabet order
    // 2. validate coins with zero amounts
    const coins = coinData
      .sort((a, b) => a.denom.localeCompare(b.denom))
      .filter((data) => {
        return data.amount > 0;
      });

    // if coin data is invalid, return null
    if (!coins.length) {
      return null;
    }

    const msg = {
      inputs: [
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
      ],
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
      this.sendData.type && this.sendData.type === 'xdefi' ? '333' : '444';

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

    const affieliateBPFee = '15';

    if (sliplimit && sliplimit.toString().length > 3) {
      const taggedSlip =
        sliplimit.toString().slice(0, sliplimit.toString().length - 3) + tag;
      return `=:${chain}.${symbol}:${addr}:${taggedSlip}:${affiliateAddress}:${affieliateBPFee}`;
    } else {
      return `=:${chain}.${symbol}:${addr}:${sliplimit}:${affiliateAddress}:${affieliateBPFee}`;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
