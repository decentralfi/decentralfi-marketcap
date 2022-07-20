import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-forget-wallet',
  templateUrl: './forget-wallet.component.html',
  styleUrls: ['./forget-wallet.component.scss'],
})
export class DForgetWalletComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<DForgetWalletComponent>) {}

  ngOnInit() {}

  closeDialog(bool) {
    this.dialogRef.close(bool);
  }
}
