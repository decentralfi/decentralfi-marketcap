import { Asset } from './asset';

export interface StakerPoolDataDTO {
  asset: string;
  units: string;
  assetStaked: string;
  currentAssetStaked: string;
  assetGainloss: string;
  assetWithdrawn: string;
  runeStaked: string;
  currentRuneStaked: string;
  runeGainloss: string;
  runeWithdrawn: string;
  dateFirstStaked: number;
  heightLastStaked: number;
  totalstakedrune: number;
  totalunstakedrune: number;
  totalcurrentrune: string;
  totalGainloss: string;
}

export class StakerPoolData {
  asset: Asset;
  units: string;
  assetStaked: string;
  currentAssetStaked: string;
  assetGainloss: string;
  assetWithdrawn: string;
  runeStaked: string;
  currentRuneStaked: string;
  runeGainloss: string;
  runeWithdrawn: string;
  dateFirstStaked: number;
  heightLastStaked: number;
  totalstakedrune: number;
  totalunstakedrune: number;
  totalcurrentrune: string;
  totalGainloss: string;

  constructor(dto: StakerPoolDataDTO) {

    this.asset = new Asset(dto.asset);
    this.units = dto.units;
    this.dateFirstStaked = dto.dateFirstStaked;
    this.heightLastStaked = dto.heightLastStaked;
    this.assetStaked = dto.assetStaked;
    this.currentAssetStaked = dto.currentAssetStaked;
    this.assetWithdrawn = dto.assetWithdrawn;
    this.runeStaked = dto.runeStaked;
    this.currentRuneStaked = dto.currentRuneStaked;
    this.runeWithdrawn = dto.runeWithdrawn;
    this.totalstakedrune = dto.totalstakedrune;
    this.totalunstakedrune = dto.totalunstakedrune;
    this.totalcurrentrune = dto.totalcurrentrune;
    this.assetGainloss = dto.assetGainloss;
    this.runeGainloss = dto.runeGainloss;
    this.totalGainloss = dto.totalGainloss;

  }

}
