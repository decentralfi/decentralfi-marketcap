/**
 * Midgard Public API
 * The Midgard Public API queries THORChain and any chains linked via the Bifröst and prepares information about the network to be readily available for public users. The API parses transaction event data from THORChain and stores them in a time-series database to make time-dependent queries easy. Midgard does not hold critical information. To interact with BEPSwap and Asgardex, users should query THORChain directly.
 *
 * OpenAPI spec version: 1.0.0-oas3
 * Contact: devs@thorchain.org
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
import { BlockRewards } from './blockRewards';
import { BondMetrics } from './bondMetrics';

export interface NetworkInfo { 
    bondMetrics?: BondMetrics;
    /**
     * Array of Active Bonds
     */
    activeBonds?: Array<string>;
    /**
     * Array of Standby Bonds
     */
    standbyBonds?: Array<string>;
    /**
     * Total Rune Staked in Pools
     */
    totalStaked?: string;
    /**
     * Number of Active Nodes
     */
    activeNodeCount?: number;
    /**
     * Number of Standby Nodes
     */
    standbyNodeCount?: number;
    /**
     * Total left in Reserve
     */
    totalReserve?: string;
    poolShareFactor?: string;
    blockRewards?: BlockRewards;
    bondingROI?: string;
    stakingROI?: string;
    nextChurnHeight?: string;
    /**
     * The remaining time of pool activation (in blocks)
     */
    poolActivationCountdown?: number;
}