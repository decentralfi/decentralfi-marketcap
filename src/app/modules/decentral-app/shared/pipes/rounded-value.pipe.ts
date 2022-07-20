import { Pipe, PipeTransform } from '@angular/core';
import { settings } from '../../../../../settings/settings';

@Pipe({
  name: 'roundedValue'
})
export class RoundedValuePipe implements PipeTransform {

  roundValue = settings.roundValue;
  transform(value: number, noround?: boolean): string {

    let rounded = Math.floor(value / this.roundValue);
    let outputValue = '';
    let strValue = '';
    let sign = '';
    let thousand = 1000;
    let million = 1000000;
    let billion = 1000000000;
    let Fixed1 = '';
    let Fixed0 = '';

    if(value == 0){
      return '0';
    }

    if(noround == true){
      rounded = +(value.toFixed(0));
    }

    if(rounded.toString().length > 3 && rounded.toString().length <= 6){
      sign = ' K';
      Fixed1 =  (rounded / thousand).toFixed(1);
      Fixed0 =  (rounded / thousand).toString().substring(0, 1);
      strValue = +Fixed1 > +Fixed0 ? Fixed1 : Fixed0;

    } else if(rounded.toString().length > 6 && rounded.toString().length <= 9){
      sign = ' M';
      Fixed1 =  (rounded / million).toFixed(1);
      Fixed0 =  (rounded / million).toString().substring(0, 1);
      strValue = +Fixed1 > +Fixed0 ? Fixed1 : Fixed0;
      
    } else if(rounded.toString().length > 9 && rounded.toString().length <= 12){
      sign = ' B';
      Fixed1 =  (rounded / billion).toFixed(1);
      Fixed0 =  (rounded / billion).toString().substring(0, 1);
      strValue = +Fixed1 > +Fixed0 ? Fixed1 : Fixed0;

    } else if((rounded.toString().length > 0 && rounded.toString().length <= 3) || rounded == 0){
      strValue = rounded.toString();
    }else{
      strValue = rounded.toFixed(8);
    }

    outputValue = strValue + sign;
    return outputValue;
  }

}
