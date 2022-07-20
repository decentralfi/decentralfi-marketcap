import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-operation-icon',
  templateUrl: './operation-icon.component.html',
  styleUrls: ['./operation-icon.component.scss'],
})
export class OperationIconComponent implements OnInit {
  @Input() type: 'add' | 'swap' | 'pending' | 'manage' | 'withdraw' | 'send';
  @Input() width: string | number = '1.25rem';
  @Input() height: string | number = '1.25rem';
  constructor() {}

  ngOnInit(): void {}
}
