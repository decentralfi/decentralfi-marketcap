// export interface MidgardConstants {
//   int_64_values: {
//     BadValidatorRate: number;
//     BlocksPerYear: number;
//     DesireValidatorSet: number;
//     DoubleSignMaxAge: number;
//     EmissionCurve: number;
//     FailKeySignSlashPoints: number;
//     FailKeygenSlashPoints: number;
//     FundMigrationInterval: number;
//     JailTimeKeygen: number;
//     JailTimeKeysign: number;
//     LackOfObservationPenalty: number;
//     MinimumBondInRune: number;
//     MinimumNodesForBFT: number;
//     MinimumNodesForYggdrasil: number;
//     NewPoolCycle: number;
//     ObserveSlashPoints: number;
//     OldValidatorRate: number;
//     OutboundTransactionFee: number;
//     RotatePerBlockHeight: number;
//     RotateRetryBlocks: number;
//     SigningTransactionPeriod: number;
//     StakeLockUpBlocks: number;
//     TransactionFee: number;
//     ValidatorRotateInNumBeforeFull: number;
//     ValidatorRotateNumAfterFull: number;
//     ValidatorRotateOutNumBeforeFull: number;
//     WhiteListGasAsset: number;
//     YggFundLimit: number;
//   };
//   bool_values: {
//     StrictBondStakeRatio: boolean;
//   };
//   string_values: {
//     DefaultPoolStatus: string;
//   };
// }

export interface MidgardConstants {
  int_64_values: {
    AsgardSize: number;
    BadValidatorRate: number;
    BadValidatorRedline: number;
    BlocksPerYear: number;
    ChurnInterval: number;
    ChurnRetryInterval: number;
    DesiredValidatorSet: number;
    DoubleSignMaxAge: number;
    EmissionCurve: number;
    FailKeygenSlashPoints: number;
    FailKeysignSlashPoints: number;
    FullImpLossProtectionBlocks: number;
    FundMigrationInterval: number;
    IncentiveCurve: number;
    JailTimeKeygen: number;
    JailTimeKeysign: number;
    LackOfObservationPenalty: number;
    LiquidityLockUpBlocks: number;
    LowBondValidatorRate: number;
    MaxAvailablePools: number;
    MaxSwapsPerBlock: number;
    MaxSynthPerAssetDepth: number;
    MinRunePoolDepth: number;
    MinSlashPointsForBadValidator: number;
    MinSwapsPerBlock: number;
    MinimumBondInRune: number;
    MinimumNodesForBFT: number;
    MinimumNodesForYggdrasil: number;
    NativeTransactionFee: number;
    ObservationDelayFlexibility: number;
    ObserveSlashPoints: number;
    OldValidatorRate: number;
    OutboundTransactionFee: number;
    PermittedSolvencyGap: number;
    PoolCycle: number;
    SigningTransactionPeriod: number;
    StagedPoolCost: number;
    TNSFeeOnSale: number;
    TNSFeePerBlock: 20;
    TNSRegisterFee: number;
    VirtualMultSynths: number;
    YggFundLimit: number;
    YggFundRetry: number;
  };
  bool_values: {
    StrictBondLiquidityRatio: false;
  };
  string_values: {
    DefaultPoolStatus: 'Staged';
  };
}
