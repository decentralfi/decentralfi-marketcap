import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { get } from 'lodash';
// import { environment } from 'src/environments/environment';
import {
  ApproveParams,
  estimateDefaultFeesWithGasPricesAndLimits,
  ETHAddress,
  getTokenAddress,
  TxOverrides,
} from '@xchainjs/xchain-ethereum';
//import { User } from '../_classes/user';
import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import { erc20ABI } from '@dexShared/abi/erc20.abi';
import { AssetETH, assetToString, Chain } from '@xchainjs/xchain-util';
import { toUtf8Bytes } from '@ethersproject/strings';
import { hexlify } from '@ethersproject/bytes';
import { MockClientService } from './mock-client.service';
import { User } from '@app/modules/dex/shared/classes/user';
import { consoleLog } from '@app/utils/consoles';
import { addressesTypes } from '@app/modules/dex/shared/interfaces/marketcap';
import { Network } from '@xchainjs/xchain-client';

@Injectable({
  providedIn: 'root',
})
export class XDEFIService {
  MOCK_PHRASE =
    'image rally need wedding health address purse army antenna leopard sea gain';

  public static listProvider = [
    {
      title: 'Ethereum Provider',
      providerPath: 'ethereum',
      enabled: true,
      disableNetworkValidation: true,
    },
    {
      title: 'Bitcoin Provider',
      providerPath: ['xfi', 'bitcoin'],
      enabled: true,
    },
    {
      title: 'BinanceDEX Provider',
      providerPath: ['xfi', 'binance'],
      enabled: true,
    },
    {
      title: 'BitcoinCash Provider',
      providerPath: ['xfi', 'bitcoincash'],
      enabled: true,
    },
    {
      title: 'LiteCoin Provider',
      providerPath: ['xfi', 'litecoin'],
      enabled: true,
    },
    {
      title: 'Dogecoin Provider',
      providerPath: ['xfi', 'dogecoin'],
      enabled: true,
    },
    {
      title: 'Thorchain Provider',
      providerPath: ['xfi', 'thorchain'],
      enabled: true,
    },
  ];

  network: string;
  phrase: string;

  constructor(private mockClientService: MockClientService) {
    const localNetwork = localStorage.getItem('dcf-network');
    this.network =
      localNetwork === 'multichain_testnet' ? Network.Testnet : Network.Mainnet;
    this.phrase = this.MOCK_PHRASE;
  }

  isValidNetwork() {
    const invalidNetworkProvider = XDEFIService.listProvider.find(
      ({ providerPath, disableNetworkValidation }) => {
        const providerInfo = get(window, providerPath);
        if (disableNetworkValidation || !providerInfo) {
          return false;
        }
        const projectNetwork =
          this.network === 'multichain_testnet' ? 'testnet' : 'mainnet';
        return projectNetwork !== providerInfo.network;
      }
    );
    return !invalidNetworkProvider;
  }

  listEnabledXDFIProviders() {
    return XDEFIService.listProvider.map((provider) => ({
      ...provider,
      enabled: get(window, provider.providerPath),
    }));
  }

  async getBnbAddress(): Promise<string> {
    if (!(window as any).xfi.binance) {
      return;
    }
    return new Promise((resolve, reject) => {
      (window as any).xfi.binance.request(
        {
          method: 'request_accounts',
          params: [],
        },
        (err: any, accounts: (string | PromiseLike<string>)[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(accounts[0]);
        }
      );
    });
  }

  async getBtcAddress(): Promise<string> {
    if (!(window as any).xfi.bitcoin) {
      return;
    }
    return new Promise((resolve, reject) => {
      (window as any).xfi.bitcoin.request(
        {
          method: 'request_accounts',
          params: [],
        },
        (err: any, accounts: (string | PromiseLike<string>)[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(accounts[0]);
        }
      );
    });
  }

  async getBchAddress(): Promise<string> {
    if (!(window as any).xfi.bitcoincash) {
      return;
    }
    return new Promise((resolve, reject) => {
      (window as any).xfi.bitcoincash.request(
        {
          method: 'request_accounts',
          params: [],
        },
        (err: any, accounts: (string | PromiseLike<string>)[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(accounts[0]);
        }
      );
    });
  }

  async getEthAddress(): Promise<string> {
    if (!(window as any).ethereum) {
      return;
    }

    return (window as any)?.ethereum?.request({
      method: 'eth_requestAccounts',
      params: [],
    });
  }

  async getThorChainAddress(): Promise<string> {
    if (!(window as any).xfi.thorchain) {
      return;
    }
    return new Promise((resolve, reject) => {
      (window as any).xfi.thorchain.request(
        {
          method: 'request_accounts',
          params: [],
        },
        (err: any, accounts: (string | PromiseLike<string>)[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(accounts[0]);
        }
      );
    });
  }

  async getLtcAddress(): Promise<string> {
    if (!(window as any).xfi.litecoin) {
      return;
    }
    return new Promise((resolve, reject) => {
      (window as any).xfi.litecoin.request(
        {
          method: 'request_accounts',
          params: [],
        },
        (err: any, accounts: (string | PromiseLike<string>)[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(accounts[0]);
        }
      );
    });
  }

  async getDogeAddress(): Promise<string> {
    if (!(window as any).xfi.dogecoin) {
      return;
    }
    return new Promise((resolve, reject) => {
      (window as any).xfi.dogecoin.request(
        {
          method: 'request_accounts',
          params: [],
        },
        (err: any, accounts: (string | PromiseLike<string>)[]) => {
          if (err) {
            return reject(err);
          }
          return resolve(accounts[0]);
        }
      );
    });
  }

  async connectXDEFI() {
    const userThorchainClient = this.mockClientService.mockThorchainClient;
    const [thorAddress] = await Promise.all([
      this.getThorChainAddress(),
      new Promise((resolve) => setTimeout(resolve, 100)),
    ]);
    userThorchainClient.getAddress = () => thorAddress;
    // Thor
    userThorchainClient.deposit = async (depositParams) => {
      return new Promise((resolve, reject) => {
        (window as any).xfi.thorchain.request(
          {
            method: 'deposit',
            params: [
              {
                ...depositParams,
                from: thorAddress,
                amount: {
                  amount: depositParams.amount.amount().toString(),
                  decimals: depositParams.amount.decimal,
                },
              },
            ],
          },
          (err: any, result: string | PromiseLike<string>) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };
    userThorchainClient.transfer = async (transferParams) => {
      consoleLog('userThorchainClient.transfer', transferParams, {
        ...transferParams,
        from: thorAddress,
        amount: {
          amount: transferParams.amount.amount().toString(),
          decimals: transferParams.amount.decimal,
        },
      });
      return new Promise((resolve, reject) => {
        (window as any).xfi.thorchain.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: thorAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err: any, result: string | PromiseLike<string>) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };
    const userBinanceClient = this.mockClientService.mockBinanceClient;
    const userBtcClient = this.mockClientService.mockBtcClient;
    const userEthereumClient = this.mockClientService.mockEthereumClient;
    const userLtcClient = this.mockClientService.mockLtcClient;
    const userbchClient = this.mockClientService.mockBchClient;
    const userDogeClient = this.mockClientService.mockDogeClient;
    const [
      bnbAddress,
      btcAddress,
      bchAddress,
      ethAddresses,
      ltcAddress,
      dogeAddress,
    ] = await Promise.all([
      this.getBnbAddress(),
      this.getBtcAddress(),
      this.getBchAddress(),
      this.getEthAddress(),
      this.getLtcAddress(),
      this.getDogeAddress(),
    ]);
    userBinanceClient.getAddress = () => bnbAddress;
    userBtcClient.getAddress = () => btcAddress;
    userbchClient.getAddress = () => bchAddress;
    userEthereumClient.getAddress = () => ethAddresses?.[0];
    userLtcClient.getAddress = () => ltcAddress;
    userDogeClient.getAddress = () => dogeAddress;

    // Binance
    userBinanceClient.transfer = async (transferParams) => {
      // consoleLog('userBinanceClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.binance.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: bnbAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err: any, result: string | PromiseLike<string>) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };

    // Bitcoin
    userBtcClient.transfer = async (transferParams) => {
      // consoleLog('userBtcClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoin.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: btcAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err: any, result: string | PromiseLike<string>) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };

    // BCH
    userbchClient.transfer = async (transferParams) => {
      consoleLog('userbchClient.transfer', {
        ...transferParams,
        from: bchAddress,
        amount: {
          amount: transferParams.amount.amount().toString(),
          decimals: transferParams.amount.decimal,
        },
      });
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoincash.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: bchAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err: any, result: string | PromiseLike<string>) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };
    // Eth
    userEthereumClient.approve = async ({
      // spender,
      // sender,
      spenderAddress,
      contractAddress,
      amount,
      feeOption,
    }: ApproveParams) => {
      const gasPrice =
        feeOption &&
        BigNumber.from(
          (
            await userEthereumClient
              .estimateGasPrices()
              .then((prices) => prices[feeOption])
              .catch(() => {
                const { gasPrices } =
                  estimateDefaultFeesWithGasPricesAndLimits();
                return gasPrices[feeOption];
              })
          )
            .amount()
            .toFixed()
        );
      const fromAddress = userEthereumClient.getAddress();
      const gasLimit = await userEthereumClient
        .estimateApprove({
          fromAddress,
          spenderAddress,
          contractAddress,
          amount,
        })
        .catch(() => undefined);

      const txAmount = amount
        ? BigNumber.from(amount.amount().toFixed())
        : BigNumber.from(2).pow(256).sub(1);
      const contract = new ethers.Contract(contractAddress, erc20ABI);
      const unsignedTx = await contract.populateTransaction['approve'](
        spenderAddress,
        txAmount,
        {
          from: userEthereumClient.getAddress(),
          gasPrice,
          gasLimit,
        }
      );
      unsignedTx.from = ethAddresses[0];
      return (window as any).ethereum
        .request({
          method: 'eth_sendTransaction',
          params: [unsignedTx],
        })
        .then((hash: string) => {
          return {
            hash,
          };
        });
    };
    const oldWallet = userEthereumClient.getWallet();
    oldWallet.getAddress = async () => ethAddresses[0];
    oldWallet.sendTransaction = (unsignedTx) => {
      unsignedTx.value = hexlify(BigNumber.from(unsignedTx.value || 0));
      return (window as any).ethereum
        .request({
          method: 'eth_sendTransaction',
          params: [unsignedTx],
        })
        .then((hash: string) => {
          return {
            hash,
          };
        });
    };
    oldWallet.signTransaction = (unsignedTx) => {
      unsignedTx.value = hexlify(BigNumber.from(unsignedTx.value || 0));

      return (window as any).ethereum.request({
        method: 'eth_signTransaction',
        params: [unsignedTx],
      });
    };
    const newGetWallet = () => {
      return oldWallet;
    };
    userEthereumClient.getWallet = newGetWallet;
    userEthereumClient.transfer = async ({
      asset,
      memo,
      amount,
      recipient,
      feeOption,
      gasPrice,
      gasLimit,
    }) => {
      try {
        const txAmount = BigNumber.from(amount.amount().toFixed());

        let assetAddress;
        if (asset && assetToString(asset) !== assetToString(AssetETH)) {
          assetAddress = getTokenAddress(asset);
        }

        const isETHAddress = assetAddress === ETHAddress;

        // feeOptionKey

        const defaultGasLimit: ethers.BigNumber = isETHAddress
          ? BigNumber.from(21000)
          : BigNumber.from(100000);

        let overrides: TxOverrides = {
          gasLimit: gasLimit || defaultGasLimit,
          gasPrice: gasPrice && BigNumber.from(gasPrice.amount().toFixed()),
        };

        consoleLog(overrides, gasLimit, defaultGasLimit);

        // override `overrides` if `feeOptionKey` is provided
        if (feeOption) {
          const _gasPrice = await userEthereumClient
            .estimateGasPrices()
            .then((prices) => prices[feeOption])
            .catch(
              () =>
                estimateDefaultFeesWithGasPricesAndLimits().gasPrices[feeOption]
            );
          const _gasLimit = await userEthereumClient
            .estimateGasLimit({ asset, recipient, amount, memo })
            .catch(() => defaultGasLimit);
          consoleLog(_gasLimit.toNumber());
          overrides = {
            gasLimit: _gasLimit,
            gasPrice: BigNumber.from(_gasPrice.amount().toFixed()),
          };
        }

        let txResult;
        if (assetAddress && !isETHAddress) {
          // Transfer ERC20
          const contract = new ethers.Contract(assetAddress, erc20ABI);
          const unsignedTx = await contract.populateTransaction['transfer'](
            recipient,
            txAmount,
            Object.assign({}, overrides)
          );
          unsignedTx.from = ethAddresses[0];
          txResult = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [unsignedTx],
          });
        } else {
          const from =
            await this.mockClientService.mockEthereumClient.getAddress();
          // Transfer ETH
          const transactionRequest = Object.assign(
            { to: recipient, from, value: txAmount },
            {
              ...overrides,
              data: memo ? toUtf8Bytes(memo) : undefined,
            }
          );
          consoleLog(transactionRequest);
          txResult = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionRequest],
          });
        }

        return txResult.hash || txResult;
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      }
    };

    userEthereumClient.call = async ({
      contractAddress,
      abi,
      funcName,
      funcParams,
    }) => {
      try {
        const params = funcParams ?? [];
        if (!contractAddress) {
          return Promise.reject(new Error('address must be provided'));
        }
        const contract = new ethers.Contract(
          contractAddress,
          abi,
          userEthereumClient.getProvider()
        );
        const txResult = await contract[funcName](...params, {
          from: ethAddresses[0],
        });
        return txResult;
      } catch (error) {
        console.error(error);

        return Promise.reject(error);
      }
    };
    // Ltc
    userLtcClient.transfer = async (transferParams) => {
      // consoleLog('userLtcClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.litecoin.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: ltcAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err: any, result: string | PromiseLike<string>) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };

    const addresses = {
      thorchain: thorAddress,
      binance: bnbAddress,
      bitcoin: btcAddress,
      bitcoincash: bchAddress,
      ethereum: ethAddresses,
      litecoin: ltcAddress,
      dogecoin: dogeAddress,
    };

    const newUser = new User({
      type: 'xdefi',
      address: thorAddress,
      clients: {
        binance: userBinanceClient,
        bitcoin: userBtcClient,
        bitcoinCash: userbchClient,
        thorchain: userThorchainClient,
        ethereum: userEthereumClient,
        litecoin: userLtcClient,
        dogecoin: userDogeClient,
      },
    });

    (window as any).xfi.thorchain.on(
      'chainChanged',
      (obj: { network: string }) => {
        const localNetwork = localStorage.getItem('dcf-network');
        let envNetwork = '';
        if (localNetwork === 'multichain_chaosnet') {
          envNetwork = 'mainnet';
        } else if (localNetwork === 'multichain_testnet') {
          envNetwork = 'testnet';
        } else {
          envNetwork =
            environment.network === 'testnet' ? 'testnet' : 'mainnet';
        }
        if (obj.network !== envNetwork) {
          consoleLog('XDEFI: Incorrect network, Reloading');
          //location.reload();
        }
      }
    );

    return { newUser, addresses };
  }
}
