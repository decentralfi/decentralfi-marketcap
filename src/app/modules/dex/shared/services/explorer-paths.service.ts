import { Injectable } from '@angular/core';
import { MockClientService } from '@app/services/mock-client.service';
import { Chain } from '@xchainjs/xchain-util';

@Injectable({
  providedIn: 'root',
})
export class ExplorerPathsService {
  constructor(private mockClientService: MockClientService) {}

  getExplorerUrl(chain: Chain, txHash: string): string {
    const explorerUrl = this.mockClientService.getMockClientByChain(chain);
    return explorerUrl.getExplorerTxUrl(txHash);
  }
}
