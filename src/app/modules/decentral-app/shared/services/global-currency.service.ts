/* This service is used to set the global currency */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { settings } from '../../../../../settings/settings';

@Injectable()
export class GlobalCurrencyService {

  private globalCurrency = new BehaviorSubject(settings.defaultCurrency);

  constructor() { }

  setGlobalCurrency(currency){
    this.globalCurrency.next(currency);
  }

  getGlobalCurrency(){
    return this.globalCurrency.asObservable();
  }

  getGlobalCurrencyValue(){
    return this.globalCurrency.value;
  }

}
