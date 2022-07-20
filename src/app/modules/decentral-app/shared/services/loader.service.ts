import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoaderService {

constructor() { }

public loaderOverlay: BehaviorSubject<string> = new BehaviorSubject<string>('loader-overlay hidden');
public confimationsNeed: BehaviorSubject<number> = new BehaviorSubject<number>(0);
public confimationPerc: BehaviorSubject<number> = new BehaviorSubject<number>(0);

loaderShow(confirmations: number){
  this.loaderOverlay.next('loader-overlay show');
  this.confimationsNeed.next(confirmations);
}

loaderHide(counter: number){

  if(counter == this.confimationsNeed.value){
    this.confimationPerc.next(100);
    this.loaderOverlay.next('loader-overlay hide');
    setTimeout(() => {
      this.confimationPerc.next(0);
    }, 2000);
  }else{
    let portion = 100 / this.confimationsNeed.value;
    let actualPerc = portion * counter;
    this.confimationPerc.next(actualPerc);
  }
}

}
