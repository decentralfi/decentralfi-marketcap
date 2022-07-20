import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetToString, Chain } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';

import { environment } from 'src/environments/environment';

// CLASSES
import { PoolAddressDTO } from '@dexShared/classes/pool-address';
import { User } from '@dexShared/classes/user';
import { TransactionConfirmationState } from '@dexShared/constants/transaction-confirmation-state';

// SERVICES
import { MidgardService } from '@dexShared/services/midgard.service';
import { UserService } from '@dexShared/services/user.service';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from '@dexShared/services/transaction-status.service';
import { EthUtilsService } from '@dexShared/services/eth-utils.service';
import { Balance } from '@xchainjs/xchain-client';
import { KeystoreDepositService } from '@dexShared/services/keystore-deposit.service';
import { Asset } from '@dexShared/classes/asset';
import { PoolTypeOption } from '@dexShared/constants/pool-type-options';
import { Client } from '@xchainjs/xchain-thorchain';
import { ethers } from 'ethers';

import { MasterWalletManagerService } from '@services/master-wallet-manager.service';
import { TranslateService } from '@ngx-translate/core';

export interface ConfirmDepositData {
  asset: Asset;
  rune: Asset;
  assetAmount: number;
  runeAmount: number;
  balances: Balance[];
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
  estimatedFee: number;
  runeFee: number;
  poolTypeOption: PoolTypeOption;
}

@Component({
  selector: 'app-confirm-add-dialog',
  templateUrl: './confirm-add-dialog.component.html',
  styleUrls: ['./confirm-add-dialog.component.scss'],
})
export class ConfirmAddDialogComponent implements OnInit {
  public resultIcon: string; // cancel //check_circle
  txState: TransactionConfirmationState | 'RETRY_RUNE_DEPOSIT';
  hash: string;
  subs: Subscription[];
  error: string;
  insufficientChainBalance: boolean;
  loading: boolean;
  estimatedMinutes: {
    time: number;
  };
  balances: Balance[];
  metaMaskProvider?: ethers.providers.Web3Provider;
  public binanceExplorerUrl: string;
  public environment: string;

  public language: string;
  public translation: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDepositData,
    public dialogRef: MatDialogRef<ConfirmAddDialogComponent>,
    private txStatusService: TransactionStatusService,
    private midgardService: MidgardService,
    private keystoreDepositService: KeystoreDepositService,
    // private metaMaskService: MetamaskService
    private ethUtilsService: EthUtilsService,
    private userService: UserService,
    private masterWalletManagerService: MasterWalletManagerService,
    public translate: TranslateService
  ) {
    this.loading = true;
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const user$ = this.userService.user$.subscribe((user) => {
      if (!user) {
        this.closeDialog();
      }
    });

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => (this.balances = balances)
    );

    this.subs = [user$, balances$];

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
    this.loading = false;
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

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(async (res) => {
      if (res && res.length > 0) {
        this.deposit(res);
      }
    });
  }

  async deposit(pools: PoolAddressDTO[]) {
    if (this.data.user?.type === 'metamask') {
      try {
        // const hash = await this.metaMaskDepositAsset(pools);
        // if (hash && hash.length > 0) {
        //   this.hash = hash;
        //   this.assetDepositSuccess(this.data.asset, hash);
        //   this.txState = TransactionConfirmationState.SUCCESS;
        // } else {
        //   this.assetDepositError("Deposit Unsuccessful");
        //   return;
        // }
      } catch (error: any) {
        this.txState = TransactionConfirmationState.ERROR;
        this.error = error;
        this.resultIcon = 'cancel';
      }
    } else if (
      this.data.user?.type === 'keystore' ||
      this.data.user?.type === 'xdefi'
    ) {
      const clients = this.data.user.clients;
      const thorClient = clients.thorchain;
      let assetHash = '';

      switch (this.data.poolTypeOption) {
        case 'SYM':
          try {
            assetHash = await this.keystoreDepositAsset(pools);
          } catch (error: any) {
            console.error('error making token transfer: ', error);
            this.txState = TransactionConfirmationState.ERROR;
            this.error = error;
            this.resultIcon = 'cancel';
            return;
          }

          if (!assetHash || assetHash.length <= 0) {
            this.assetDepositError('Deposit Unsuccessful');
            return;
          }

          this.assetDepositSuccess(this.data.asset, assetHash);

          try {
            const runeHash = await this.depositRune(
              thorClient,
              this.data.asset
            );

            this.runeDepositSuccess(runeHash);
          } catch (error: any) {
            console.error('error making RUNE transfer: ', error);
            this.txState = 'RETRY_RUNE_DEPOSIT';
            this.error = error;
            return;
          }
          break;

        case 'ASYM_ASSET':
          try {
            assetHash = await this.keystoreDepositAsset(pools);
            this.hash = assetHash;

            if (!assetHash || assetHash.length <= 0) {
              this.assetDepositError('Deposit Unsuccessful');
              return;
            }

            this.assetDepositSuccess(this.data.asset, assetHash);
            this.txState = TransactionConfirmationState.SUCCESS;
            this.resultIcon = 'check_circle';
          } catch (error: any) {
            console.error('error making token transfer: ', error);
            this.txState = TransactionConfirmationState.ERROR;
            this.error = error;
            this.resultIcon = 'cancel';
            return;
          }
          break;

        case 'ASYM_RUNE':
          // const assetHash = await this.assetDeposit(pools);
          try {
            const runeHash = await this.depositRune(
              thorClient,
              this.data.asset
            );

            if (runeHash && runeHash.length > 0) {
              this.runeDepositSuccess(runeHash);
            } else {
              this.assetDepositError('Deposit Unsuccessful');
              return;
            }
            break;
          } catch (error: any) {
            console.error('error making RUNE transfer: ', error);
            this.txState = 'RETRY_RUNE_DEPOSIT';
            this.error = error;
            this.txState = TransactionConfirmationState.ERROR;
            this.resultIcon = 'cancel';
            return;
          }
      }
    }
  }

  async keystoreDepositAsset(pools: PoolAddressDTO[]) {
    const clients = this.data.user.clients;
    const thorClient = clients.thorchain;
    const thorchainAddress = await thorClient.getAddress();
    let hash = '';

    // get token address
    const address = this.userService.getTokenAddress(
      this.data.user,
      this.data.asset.chain
    );
    if (!address || address === '') {
      console.error('no address found');
      return;
    }

    // find recipient pool
    const recipientPool = pools.find(
      (pool) => pool.chain === this.data.asset.chain
    );
    if (!recipientPool) {
      console.error('no recipient pool found');
      return;
    }

    // Deposit token
    try {
      // deposit using xchain
      switch (this.data.asset.chain) {
        case 'BNB':
          hash = await this.keystoreDepositService.binanceDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.binance,
            poolType: this.data.poolTypeOption,
            thorchainAddress,
            recipientPool,
          });
          break;

        case 'BTC':
          hash = await this.keystoreDepositService.bitcoinDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.bitcoin,
            balances: this.data.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });
          break;

        case 'DOGE':
          hash = await this.keystoreDepositService.dogecoinDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.dogecoin,
            balances: this.data.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });
          break;

        case 'LTC':
          hash = await this.keystoreDepositService.litecoinDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.litecoin,
            balances: this.data.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });
          break;

        case 'BCH':
          hash = await this.keystoreDepositService.bchDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.bitcoinCash,
            balances: this.data.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });

          break;

        case 'ETH':
          hash = await this.keystoreDepositService.ethereumDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            balances: this.data.balances,
            client: this.data.user.clients.ethereum,
            thorchainAddress,
            recipientPool,
            poolType: this.data.poolTypeOption,
          });
          break;

        default:
          console.error(`${this.data.asset.chain} does not match`);
          return;
      }

      if (hash === '') {
        console.error('no hash set');
        return;
      }
      return hash;
    } catch (error: any) {
      console.error('error making token transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
      this.resultIcon = 'cancel';
      return;
    }
  }

  async depositRune(thorClient: Client, asset: Asset): Promise<string> {
    // deposit RUNE
    try {
      const address = this.userService.getTokenAddress(
        this.data.user,
        this.data.asset.chain
      );

      if (!address || address === '') {
        throw new Error('No Address Found');
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

      const runeHash = await this.keystoreDepositService.runeDeposit({
        client: thorClient,
        inputAmount: this.data.runeAmount,
        memo:
          this.data.poolTypeOption === 'SYM'
            ? `+:${asset.chain}.${asset.symbol}:${address}:${affiliateAddress}:${affieliateBPFee}`
            : `+:${asset.chain}.${asset.symbol}`,
        // ? `+:${asset.chain}.${asset.symbol}:${address}`
        // : `+:${asset.chain}.${asset.symbol}`,
        asset: this.data.rune,
      });

      return runeHash;
    } catch (error: any) {
      console.error('error making RUNE transfer: ', error);
      this.txState = 'RETRY_RUNE_DEPOSIT';
      this.error = error;
      return;
    }
  }

  runeDepositSuccess(runeHash: string) {
    this.hash = runeHash;
    this.txStatusService.addTransaction({
      chain: Chain.THORChain,
      hash: runeHash,
      ticker: `RUNE`,
      status: TxStatus.PENDING,
      action: TxActions.ADD,
      symbol: this.data.asset.symbol,
      poolTypeOption: this.data.poolTypeOption,
      isThorchainTx: true,
      assetAmount:
        this.data.poolTypeOption === 'ASYM_RUNE'
          ? this.data.runeAmount
          : this.data.assetAmount,
      out_asset: this.data.rune.fullname,
      out_amount: this.data.runeAmount,
    });
    this.txState = TransactionConfirmationState.SUCCESS;
    this.resultIcon = 'check_circle';
  }

  runeDepositError(error: string) {
    this.txState = TransactionConfirmationState.ERROR;
    this.error = error;
    this.resultIcon = 'cancel';
  }
  assetDepositError(error: string) {
    this.txState = TransactionConfirmationState.ERROR;
    this.error = error;
    this.resultIcon = 'cancel';
  }

  assetDepositSuccess(asset: Asset, hash: string) {
    this.txStatusService.addTransaction({
      chain: asset.chain,
      hash,
      ticker: `${this.data.asset.ticker}`,
      status: TxStatus.PENDING,
      action: TxActions.ADD,
      symbol: this.data.asset.symbol,
      poolTypeOption: this.data.poolTypeOption,
      isThorchainTx: this.data.poolTypeOption === 'SYM' ? false : true,
      assetAmount:
        this.data.poolTypeOption === 'ASYM_RUNE'
          ? this.data.runeAmount
          : this.data.assetAmount,
      out_asset: this.data.rune.fullname,
      out_amount: this.data.runeAmount,
    });
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }
}
