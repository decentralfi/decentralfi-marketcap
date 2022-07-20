import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
  name: 'roundedValue',
})
export class RoundedValuePipe implements PipeTransform {
  constructor(private decimalPipe: DecimalPipe) {}

  transform(value: number): string {
    let rounded = value == undefined ? 0 : +value.toFixed(0);
    let outputValue = '';
    let strValue = '';
    let sign = '';
    let thousand = 1000;
    let million = 1000000;
    let billion = 1000000000;
    let trillion = 1000000000000;
    let quadrillion = 1000000000000000;
    let quintillion = 1000000000000000000;
    let Fixed1 = '';

    if (value == 0) {
      return '0';
    }

    if (value < 0) {
      rounded = +(value * -1).toFixed(0);
    }

    if (rounded.toString().length == 6) {
      sign = ' K';
      Fixed1 = (rounded / thousand).toFixed(1);
      strValue = this.decimalPipe.transform(+Fixed1, '0.0-2')!;
    } else if (
      rounded.toString().length > 3 &&
      rounded.toString().length <= 5
    ) {
      strValue = this.decimalPipe.transform(value, '0.0-2')!;
    } else if (
      rounded.toString().length > 6 &&
      rounded.toString().length <= 9
    ) {
      sign = ' M';
      Fixed1 = (rounded / million).toFixed(2);
      strValue = this.decimalPipe.transform(+Fixed1, '0.0-2')!;
    } else if (
      rounded.toString().length > 9 &&
      rounded.toString().length <= 12
    ) {
      sign = ' B';
      Fixed1 = (rounded / billion).toFixed(1);
      strValue = this.decimalPipe.transform(+Fixed1, '0.0-2')!;
    } else if (
      rounded.toString().length > 12 &&
      rounded.toString().length <= 15
    ) {
      sign = ' T';
      Fixed1 = (rounded / trillion).toFixed(1);
      strValue = this.decimalPipe.transform(+Fixed1, '0.0-2')!;
    } else if (
      rounded.toString().length > 15 &&
      rounded.toString().length <= 18
    ) {
      sign = ' Q';
      Fixed1 = (rounded / quadrillion).toFixed(1);
      strValue = this.decimalPipe.transform(+Fixed1, '0.0-2')!;
    } else if (
      rounded.toString().length > 18 &&
      rounded.toString().length <= 21
    ) {
      sign = ' Qt';
      Fixed1 = (rounded / quintillion).toFixed(1);
      strValue = this.decimalPipe.transform(+Fixed1, '0.0-2')!;
    } else if (
      (rounded.toString().length > 0 && rounded.toString().length <= 3) ||
      rounded == 0
    ) {
      strValue = this.decimalPipe.transform(value, '0.0-2')!;
    } else {
      strValue = rounded.toFixed(8);
    }

    if (value > 0 && value < 0.01) {
      strValue = this.decimalPipe.transform(value, '0.0-4')!;
    } else if (value > 0 && value < 0.0001) {
      strValue = this.decimalPipe.transform(value, '0.0-6')!;
    }

    outputValue = strValue + sign;

    if (value < 0) {
      if (strValue.search('-') != -1) {
        strValue = strValue.slice(1, strValue.length);
      }
      outputValue = '-' + strValue + sign;
    }
    return outputValue;
  }
}
