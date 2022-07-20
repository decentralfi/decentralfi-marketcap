import {
  CoinIconsFromTrustWallet,
  EthIconsFromTrustWallet,
} from '../constants/icon-list';
import { assetFromString, Chain } from '@xchainjs/xchain-util';
import { ethers } from 'ethers';

export class Asset {
  public readonly chain: Chain;

  public readonly symbol: string;

  public readonly ticker: string;

  public synth: boolean;

  public readonly type: string;

  public readonly fullname: string;

  public readonly chainDotTicker: string;

  public iconPath: string;

  public decimal: number;

  public fullChainName:
    | 'bitcoin'
    | 'bitcoincash'
    | 'binance'
    | 'ethereum'
    | 'litecoin'
    | 'dogecoin'
    | 'terra'
    | 'thorchain'
    | '';

  // created for USD pricing
  public static USD(): Asset {
    return new Asset('THOR.USD-USD');
  }

  public static BNB(): Asset {
    return new Asset('BNB.BNB');
  }

  public static RUNE(): Asset {
    return new Asset('THOR.RUNE');
  }

  public static BNB_RUNE(): Asset {
    return new Asset('BNB.RUNE');
  }

  public static ETH_RUNE(): Asset {
    return new Asset('ETH.RUNE');
  }

  public static BTC(): Asset {
    return new Asset('BTC.BTC');
  }

  public static ETH(): Asset {
    return new Asset('ETH.ETH');
  }

  public static DOGE(): Asset {
    return new Asset('DOGE.DOGE');
  }

  public static LTC(): Asset {
    return new Asset('LTC.LTC');
  }

  public static BCH(): Asset {
    return new Asset('BCH.BCH');
  }

  public static LUNA(): Asset {
    return new Asset('TERRA.LUNA');
  }

  public static ATOM(): Asset {
    return new Asset('GAIA.ATOM');
  }

  public static fromAssetString(asset: string): Asset | null {
    const { chain, symbol } = assetFromString(asset) || {};

    if (chain && symbol) {
      return new Asset(`${chain}.${symbol.toUpperCase()}`);
    }

    return null;
  }

  constructor(poolName: string, isSynth = false) {
    const { chain, symbol, ticker } = this.getAssetFromString(poolName);

    this.chain = chain;
    this.symbol = symbol;
    this.ticker = ticker;
    this.fullname = chain + '.' + symbol;
    this.chainDotTicker = chain + '.' + ticker;
    this.synth = false;

    const trustWalletMatch = CoinIconsFromTrustWallet[this.ticker];

    this.fullChainName = this.getNetworkFullname(chain);

    if (chain == 'TERRA') {
      if (this.fullname == 'TERRA.LUNA') {
        this.iconPath =
          '/assets/icons/tokens/terra-luna.6767c7f8985db7f64b69.png';
      } else if (this.fullname == 'TERRA.UST') {
        this.iconPath =
          '/assets/icons/tokens/terra-ust.f48c996d0284e27cfc1e.png';
      }
    } else if (chain == 'GAIA') {
      if (this.fullname == 'GAIA.ATOM') {
        this.iconPath = '/assets/icons/tokens/asset-atom.svg';
      }
    } else if (chain == 'ETH' && ticker != 'ETH') {
      // Find token icons from ethereum network
      const ethMatch = EthIconsFromTrustWallet[ticker];

      if (
        this.fullname == 'ETH.ALCX-0XDBDB4D16EDA451D0503B854CF79D55697F90C8DF'
      ) {
        this.iconPath = 'https://etherscan.io/token/images/Alchemix_32.png';
      } else if (
        this.fullname == 'ETH.WBTC-0X2260FAC5E5542A773AA44FBCFEDF7C193BC2C599'
      ) {
        this.iconPath =
          'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=013';
      } else if (this.fullname.includes('ETH.XRUNE') == true) {
        this.iconPath = 'https://etherscan.io/token/images/xrunetoken_32.png';
      } else if (this.fullname.includes('ETH.UST') == true) {
        this.iconPath =
          '/assets/icons/tokens/terra-ust.f48c996d0284e27cfc1e.png';
      } else if (this.fullname.includes('ETH.TKN18') == true) {
        this.iconPath =
          '/assets/icons/tokens/asset-rune.84d6fe9e6b77ef92d048fe7a44c9370d.svg';
      } else if (this.fullname.includes('ETH.TGT') == true) {
        this.iconPath =
          '/assets/icons/tokens/tgt_logo.f2c774f9e6ccc8220d6e.png';
      } else {
        this.iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${ethMatch}/logo.png`;
      }
    } else {
      if (trustWalletMatch && this.ticker != 'RUNE') {
        this.iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
      } else {
        // Override token icons when not found in trustwallet
        switch (chain) {
          case 'BTC':
            this.iconPath =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
            break;

          case 'LTC':
            this.iconPath =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/litecoin/info/logo.png';
            break;

          case 'BNB':
            if (ticker === 'BNB') {
              this.iconPath =
                '/assets/icons/tokens/asset-bnb.30ddcde6eab16c1b101775001ca5cc45.svg';
            }
            break;

          case 'ETH':
            if (this.symbol !== 'ETH') {
              // for ETH tokens
              this.iconPath = this._setEthIconPath(symbol, ticker);
            }
            break;

          case 'THOR':
            this.iconPath =
              '/assets/icons/tokens/asset-rune.84d6fe9e6b77ef92d048fe7a44c9370d.svg';
            break;

          case 'BCH':
            this.iconPath =
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoincash/info/logo.png';
            break;

          case 'DOGE':
            this.iconPath =
              '/assets/icons/tokens/dogecoin.b8d7759b60f351e31caf.png';
            break;

          default:
            console.warn(
              `Icon not available for poolName ${poolName}. Add override in classes\\asset.ts`
            );
            this.iconPath = 'assets/images/thorchain-logo.svg';
            break;
        }
      }
    }
  }

  private _setEthIconPath(assetSymbol: string, assetTicker: string): string {
    const assetAddress = assetSymbol.slice(assetTicker.length + 1);
    const strip0x = assetAddress.substr(2);
    const checkSummedAddress = ethers.utils.getAddress(strip0x);
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checkSummedAddress}/logo.png`;
  }

  getAssetFromString(poolName: string): {
    chain: Chain;
    symbol: string;
    ticker: string;
  } {
    let chain: Chain;
    let symbol: string;
    let ticker: string;

    const data = poolName?.split('.');

    if (poolName?.includes('.')) {
      chain = data[0] as Chain;
      symbol = data[1];
    } else {
      symbol = data && data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }

    return { chain, symbol, ticker };
  }

  // NEW

  eq(asset: Asset): boolean {
    return (
      this.chain === asset.chain &&
      this.symbol.toUpperCase() === asset.symbol.toUpperCase() &&
      this.ticker.toUpperCase() === asset.ticker.toUpperCase()
      // this.decimal === asset.decimal
    );
  }

  isRUNE(): boolean {
    return this.eq(Asset.RUNE());
  }

  isBNB(): boolean {
    return this.eq(Asset.BNB());
  }

  isETH(): boolean {
    return this.eq(Asset.ETH());
  }
  isDOGE(): boolean {
    return this.eq(Asset.DOGE());
  }

  getNetworkFullname(
    chain: Chain
  ):
    | 'bitcoin'
    | 'bitcoincash'
    | 'binance'
    | 'ethereum'
    | 'litecoin'
    | 'dogecoin'
    | 'terra'
    | 'thorchain'
    | '' {
    if (chain == 'BTC') {
      return 'bitcoin';
    } else if (chain == 'LTC') {
      return 'litecoin';
    } else if (chain == 'BNB') {
      return 'binance';
    } else if (chain == 'ETH') {
      return 'ethereum';
    } else if (chain == 'THOR') {
      return 'thorchain';
    } else if (chain == 'BCH') {
      return 'bitcoincash';
    } else if (chain == 'DOGE') {
      return 'dogecoin';
    } else if (chain == 'TERRA') {
      return 'terra';
    }
    return '';
  }
}

export const getChainAsset = (chain: Chain): Asset => {
  switch (chain) {
    case 'BTC':
      return new Asset('BTC.BTC');

    case 'LTC':
      return new Asset('LTC.LTC');

    case 'BCH':
      return new Asset('BCH.BCH');

    case 'ETH':
      return new Asset('ETH.ETH');

    case 'BNB':
      return new Asset('BNB.BNB');

    case 'THOR':
      return new Asset('THOR.RUNE');

    case 'DOGE':
      return new Asset('DOGE.DOGE');

    default:
      return null;
  }
};

export const checkSummedAsset = (
  poolName: string
): { chain: Chain; ticker: string; symbol: string; synth: boolean } => {
  const asset = new Asset(poolName);
  const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
  const strip0x =
    assetAddress.substr(0, 2).toUpperCase() === '0X'
      ? assetAddress.substr(2)
      : assetAddress;
  const checkSummedAddress = ethers.utils.getAddress(strip0x);
  return {
    chain: asset.chain,
    ticker: asset.ticker,
    symbol: `${asset.ticker}-${checkSummedAddress}`,
    synth: asset.synth,
  };
};
