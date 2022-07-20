import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { assetToString, baseAmount, Chain } from '@xchainjs/xchain-util';
import { ethers } from 'ethers';

import { environment } from 'src/environments/environment';

import { User } from '@dexShared/classes/user';
import { Asset } from '@dexShared/classes/asset';

import { TransactionConfirmationState } from '@dexShared/constants/transaction-confirmation-state';
import { PoolTypeOption } from '@dexShared/constants/pool-type-options';

import { UserService } from '@dexShared/services/user.service';
import { TransactionUtilsService } from '@dexShared/services/transaction-utils.service';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from '@dexShared/services/transaction-status.service';
import { EthUtilsService } from '@dexShared/services/eth-utils.service';
import { MidgardService } from '@dexShared/services/midgard.service';
import { MetamaskService } from '@dexShared/services/metamask.service';
import { consoleLog } from '@app/utils/consoles';

import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

export interface ConfirmWithdrawData {
  asset: Asset;
  rune: Asset;
  assetAmount: number;
  runeAmount: number;
  user: User;
  unstakePercent: number;
  runeFee: number;
  networkFee: number;
  withdrawType: PoolTypeOption;
  poolType: PoolTypeOption;
}

@Component({
  selector: 'app-confirm-withdraw-dialog',
  templateUrl: './confirm-withdraw-dialog.component.html',
  styleUrls: ['./confirm-withdraw-dialog.component.scss'],
})
export class ConfirmWithdrawDialogComponent implements OnInit {
  public resultIcon: string; // cancel //check_circle
  txState: TransactionConfirmationState;
  hash: string;
  subs: Subscription[];
  killPolling: Subject<void> = new Subject();
  error: any;
  estimatedMinutes: {
    time: number;
  };
  rune = new Asset('THOR.RUNE');
  metaMaskProvider?: ethers.providers.Web3Provider;
  public binanceExplorerUrl: string;
  public environment: string;

  public language: string;
  public translation: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmWithdrawData,
    public dialogRef: MatDialogRef<ConfirmWithdrawDialogComponent>,
    private txStatusService: TransactionStatusService,
    private txUtilsService: TransactionUtilsService,
    private userService: UserService,
    private ethUtilsService: EthUtilsService,
    private midgardService: MidgardService,
    private metaMaskService: MetamaskService,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const user$ = this.userService.user$.subscribe((user) => {
      if (!user) {
        this.closeDialog();
      }
    });

    const metaMaskProvider$ = this.metaMaskService.provider$.subscribe(
      (provider) => (this.metaMaskProvider = provider)
    );

    this.subs = [user$, metaMaskProvider$];

    this.binanceExplorerUrl = 'https://viewblock.io/thorchain/tx/';

    const localNetwork = localStorage.getItem('dcf-network');
    if (localNetwork == 'multichain_chaosnet') {
      this.environment = 'chaosnet';
    } else if (localNetwork == 'multichain_testnet') {
      this.environment = 'testnet';
    } else {
      this.environment =
        environment.network === 'testnet' ? 'testnet' : 'chaosnet';
    }
  }

  ngOnInit(): void {
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
    if (this.data.asset.chain === 'ETH' && this.data.asset.symbol !== 'ETH') {
      this.estimatedMinutes.time = await this.ethUtilsService.estimateERC20Time(
        assetToString(this.data.asset),
        this.data.assetAmount
      );
    } else {
      this.estimatedMinutes.time = this.txStatusService.estimateTime(
        this.data.asset.chain,
        this.data.assetAmount
      );
    }
  }

  async submitTransaction(): Promise<void> {
    this.txState = TransactionConfirmationState.SUBMITTING;

    let memo = '';
    if (this.data.poolType == 'SYM') {
      if (this.data.withdrawType == 'SYM') {
        memo = `-:${this.data.asset.chain}.${this.data.asset.symbol}:${
          Math.round(this.data.unstakePercent) * 100
        }`;
      } else if (this.data.withdrawType == 'ASYM_ASSET') {
        memo = `-:${this.data.asset.chain}.${this.data.asset.symbol}:${
          Math.round(this.data.unstakePercent) * 100
        }:${this.data.asset.chain}.${this.data.asset.symbol}`;
      } else {
        memo = `-:${this.data.asset.chain}.${this.data.asset.symbol}:${
          Math.round(this.data.unstakePercent) * 100
        }:THOR.RUNE`;
      }
    } else {
      memo = `-:${this.data.asset.chain}.${this.data.asset.symbol}:${
        Math.round(this.data.unstakePercent) * 100
      }`;
    }
    const user = this.data.user;

    if (user?.type === 'xdefi' || user?.type === 'keystore') {
      if (this.data.poolType === 'ASYM_ASSET') {
        this.keystoreAssetWithdraw(memo);
      } else {
        this.runeWithdraw(memo);
      }
    } else if (user?.type === 'metamask') {
      // this.metaMaskAssetWithdraw(memo);
    }
  }

  async runeWithdraw(memo: string) {
    // withdraw RUNE
    try {
      const txCost = baseAmount(0);

      const thorClient = this.data.user.clients.thorchain;
      if (!thorClient) {
        console.error('no thor client found!');
        return;
      }

      const hash = await thorClient.deposit({
        asset: new Asset('THOR.RUNE'),
        amount: txCost,
        memo,
      });

      this.txSuccess(hash);
    } catch (error) {
      console.error('error making RUNE withdraw: ', error);
      this.error = error;
      this.txState = TransactionConfirmationState.ERROR;
      this.resultIcon = 'cancel';
    }
  }

  async keystoreAssetWithdraw(memo: string) {
    try {
      const asset = this.data.asset;

      const inboundAddresses = await this.midgardService
        .getInboundAddresses()
        .toPromise();
      if (!inboundAddresses) {
        console.error('no inbound addresses found');
        this.error = 'No Inbound Addresses Found. Please try again later.';
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
        return;
      }

      const matchingInboundAddress = inboundAddresses.find(
        (inbound) => inbound.chain === asset.chain
      );
      if (!matchingInboundAddress) {
        console.error('no matching inbound addresses found');
        this.error =
          'No Matching Inbound Address Found. Please try again later.';
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
        return;
      }

      const minAmount = this.txUtilsService.getMinAmountByChain(asset.chain);
      let hash = '';
      if (asset.chain == 'ETH') {
        const ethClient = this.data.user.clients.ethereum;
        if (!ethClient) {
          console.error('no ETH client found for withdraw');
          this.error = 'No Eth Client Found. Please try again later.';
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
          return;
        }
        const ethHash = await this.ethUtilsService.callDeposit({
          inboundAddress: matchingInboundAddress,
          ethClient,
          asset: new Asset('ETH.ETH'),
          amount: minAmount.amount(),
          memo,
        });

        hash = this.ethUtilsService.strip0x(ethHash);
      } else if (asset.chain == 'DOGE') {
        const dogeClient = this.data.user.clients.dogecoin;
        if (!dogeClient) {
          console.error('no client found for withdraw');
          this.error = 'No Client Found. Please try again later.';
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
          return;
        }

        hash = await dogeClient.transfer({
          asset: {
            chain: asset.chain,
            symbol: asset.symbol,
            ticker: asset.ticker,
            synth: asset.synth,
          },
          amount: minAmount,
          recipient: matchingInboundAddress.address,
          memo,
        });
      } else if (
        asset.chain == 'BTC' ||
        asset.chain == 'BCH' ||
        asset.chain == 'LTC' ||
        asset.chain == 'BNB'
      ) {
        const client = this.userService.getChainClient(
          this.data.user,
          asset.chain
        );
        if (!client) {
          console.error('no client found for withdraw');
          this.error = 'No Client Found. Please try again later.';
          this.txState = TransactionConfirmationState.ERROR;
          this.resultIcon = 'cancel';
          return;
        }

        hash = await client.transfer({
          asset: {
            chain: asset.chain,
            symbol: asset.symbol,
            ticker: asset.ticker,
            synth: asset.synth,
          },
          amount: minAmount,
          recipient: matchingInboundAddress.address,
          memo,
          feeRate: +matchingInboundAddress.gas_rate,
        });
      }

      if (hash.length > 0) {
        this.txSuccess(hash);
      } else {
        console.error('hash empty');
        this.error = 'Error withdrawing, hash is empty. Please try again later';
        this.txState = TransactionConfirmationState.ERROR;
        this.resultIcon = 'cancel';
      }
    } catch (error) {
      console.error(error);
      this.error = 'Error withdrawing. Please try again later';
      this.txState = TransactionConfirmationState.ERROR;
      this.resultIcon = 'cancel';
    }
  }

  txSuccess(hash: string) {
    this.txState = TransactionConfirmationState.SUCCESS;
    this.resultIcon = 'check_circle';
    this.hash = hash;

    consoleLog('txSuccess WIDTHDRAW', {
      chain: Chain.THORChain,
      hash: this.hash,
      ticker: `${this.data.asset.ticker}-RUNE`,
      symbol: this.data.asset.symbol,
      status: TxStatus.PENDING,
      action: TxActions.WITHDRAW,
      isThorchainTx: true,
      assetAmount:
        this.data.withdrawType === 'ASYM_RUNE'
          ? this.data.runeAmount
          : this.data.assetAmount,
      out_asset: this.data.rune.fullname,
      out_amount: this.data.runeAmount,
    });

    this.txStatusService.addTransaction({
      chain: Chain.THORChain,
      hash: this.hash,
      ticker: `${this.data.asset.ticker}-RUNE`,
      symbol: this.data.asset.symbol,
      status: TxStatus.PENDING,
      action: TxActions.WITHDRAW,
      isThorchainTx: true,
      assetAmount:
        this.data.withdrawType === 'ASYM_RUNE'
          ? this.data.runeAmount
          : this.data.assetAmount,
      out_asset: this.data.rune.fullname,
      out_amount: this.data.runeAmount,
    });
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
