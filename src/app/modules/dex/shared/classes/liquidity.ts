import { Percent } from './percentage';
import { Amount } from './amount';
import { Pool } from './pool';
// import { PoolDTO as Pool } from '../interfaces/pool';

import { MULTICHAIN_DECIMAL } from '../constants/decimals';

export type WithdrawAmount = {
  runeAmount: Amount;
  assetAmount: Amount;
};

export class Liquidity {
  public readonly pool: Pool;

  public readonly poolUnits: Amount;

  public readonly liquidityUnits: Amount;

  constructor(pool: Pool, liquidityUnits: Amount) {
    this.pool = pool;
    this.poolUnits = Amount.fromBaseAmount(
      pool.detail.units,
      MULTICHAIN_DECIMAL
    );
    this.liquidityUnits = liquidityUnits;
  }

  public get poolShare(): Percent {
    // formula: liquidity Units / total Units
    return new Percent(this.liquidityUnits.div(this.poolUnits).assetAmount);
  }

  public get assetShare(): Amount {
    // formula: Total Balance * liquidity Units / total Units
    return this.pool.assetDepth.mul(this.liquidityUnits).div(this.poolUnits);
  }

  public get runeShare(): Amount {
    // formula: Total Balance * liquidity Units / total Units
    return this.pool.runeDepth.mul(this.liquidityUnits).div(this.poolUnits);
  }

  getPoolShareEst({
    runeAddAmount,
    assetAddAmount,
  }: {
    runeAddAmount: Amount;
    assetAddAmount: Amount;
  }): Percent {
    // get units after add
    const estimatedLiquidityUnits = this.liquidityUnits.add(
      this.getLiquidityUnits(runeAddAmount, assetAddAmount)
    );

    // consoleLog({
    //   estimatedLiquidityUnits: estimatedLiquidityUnits
    //     .div(this.poolUnits)
    //     .assetAmount.toNumber(),
    //   poolUnits: this.poolUnits.assetAmount.toNumber(),
    //   liquidityUnits: this.liquidityUnits.assetAmount.toNumber(),
    // });
    return new Percent(estimatedLiquidityUnits.div(this.poolUnits).assetAmount);
  }

  /**
   * get liquidity units after liquidity is added to the pool
   *
   * @param runeAddAmount rune amount to add
   * @param assetAddAmount asset amount to add
   */
  getLiquidityUnits(runeAddAmount: Amount, assetAddAmount: Amount): Amount {
    // formula: ((R + T) (r T + R t))/(4 R T)
    const R = this.pool.runeDepth.add(runeAddAmount); // Must add r first
    const T = this.pool.assetDepth.add(assetAddAmount); // Must add t first
    const part1 = R.add(T);
    const part2 = runeAddAmount.mul(T);
    const part3 = R.mul(assetAddAmount);
    const numerator = part1.mul(part2.add(part3));
    const denominator = R.mul(T).mul(4);

    return numerator.div(denominator);
  }

  /**
   * get slip for add liquidity
   *
   * @param runeAddAmount rune amount to add
   * @param assetAddAmount asset amount to add
   */
  getLiquiditySlip(runeAddAmount: Amount, assetAddAmount: Amount): Percent {
    // formula: (t * R - T * r)/ (T*r + R*T)
    const R = this.pool.runeDepth;
    const T = this.pool.assetDepth;
    const numerator = assetAddAmount.mul(R).sub(T.mul(runeAddAmount));
    const denominator = T.mul(runeAddAmount).add(R.mul(T));

    return new Percent(numerator.div(denominator).assetAmount);
  }

  getWithdrawAmount(percent: Percent): WithdrawAmount {
    const runeAmount = this.runeShare.mul(percent);
    const assetAmount = this.assetShare.mul(percent);

    return {
      runeAmount,
      assetAmount,
    };
  }
}
