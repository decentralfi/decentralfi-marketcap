/* This service is used to set the global network (singlechain - multichain)*/
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { settings } from '../../../../../settings/settings';

@Injectable({
  providedIn: 'root'
})
export class NetworkChainService {

  private globalNetwork = new BehaviorSubject<string>(settings.defaultNetwork);

  constructor() { }

  setGlobalNetwork(network: string){
    this.globalNetwork.next(network);
  }

  getGlobalNetwork(): Observable<string>{
    return this.globalNetwork.asObservable();
  }

}
