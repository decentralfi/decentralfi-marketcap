/* This service is used to set the global periods of time */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { settings } from '../../../../../settings/settings';

@Injectable()
export class GlobalTimePeriodService {

  private globalTimePeriod = new BehaviorSubject(settings.defaultTimePeriod);

  constructor() { }

  setGlobalTimePeriod(period){
    this.globalTimePeriod.next(period);
  }

  getGlobalTimePeriod(){
    return this.globalTimePeriod.asObservable();
  }

  getGlobalTimePeriodValue(){
    return this.globalTimePeriod.value;
  }

}
