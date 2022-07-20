import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
})
export class SliderComponent {
  @Input() valueToBind = 0;
  @Output() sliderValueChanged = new EventEmitter();

  sliderOptions: Options = {
    floor: 0,
    ceil: 100,
    maxRange: 100,
    minRange: 0,
    hideLimitLabels: true,
    showSelectionBar: true,
    translate: (value: number): string => {
      return `${value}%`;
    },
    // hidePointerLabels: true,
  };

  sliderChange(value): void {
    this.sliderValueChanged.emit(value);
  }
}
