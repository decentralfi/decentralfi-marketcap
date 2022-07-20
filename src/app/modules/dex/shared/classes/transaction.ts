export class TransactionDTO {
  count: string;
  actions: Transaction[];
}

export interface AssetAmount {
  asset: string;
  amount: string;
}

export interface TransactionDetail {
  txID: string;
  // memo: string;
  address: string;
  coins: AssetAmount[];
  // options: {
  //   priceTarget: string;
  //   withdrawBasisPoints: string;
  //   asymmetry: string;
  // };
}

export type TransactionType =
  | 'swap'
  | 'addLiquidity'
  | 'withdraw'
  | 'donate'
  | 'refund'
  | 'switch';

export type TransactionStatus = 'success' | 'pending';

// export enum ActionStatusEnum {
//   Success = 'success',
//   Pending = 'pending',
// }

// export enum ActionTypeEnum {
//   Swap = 'swap',
//   AddLiquidity = 'addLiquidity',
//   Withdraw = 'withdraw',
//   Donate = 'donate',
//   Refund = 'refund',
// }

export interface Metadata {
  swap: {
    networkFees: [
      {
        asset: string;
        amount: string;
      }
    ];
    liquidityFee: string;
    swapSlip: string;
    swapTarget: string;
  };
  addLiquidity: {
    liquidityUnits: string;
  };
  withdraw: {
    liquidityUnits: string;
    asymmetry: string;
    basisPoints: string;
    networkFees: [
      {
        asset: string;
        amount: string;
      }
    ];
    impermanentLossProtection: string;
  };
  refund: {
    networkFees: [
      {
        asset: string;
        amount: string;
      }
    ];
    reason: string;
  };
}

export class Transaction {
  pools: string[];
  type: TransactionType;
  status: TransactionStatus;
  in: TransactionDetail[];
  out: TransactionDetail[];
  date: string;
  height: string;
  metadata: Metadata;
  events?: {
    // TODO REMOVE
    fee: string;
    stakeUnits: string;
    slip: string;
  };
}
