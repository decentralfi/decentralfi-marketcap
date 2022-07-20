import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface iData {
  confirmed: boolean;
}

@Component({
  selector: 'app-confirm-transaction',
  templateUrl: './confirm-transaction.component.html',
  styleUrls: ['./confirm-transaction.component.scss'],
})
export class ConfirmTransactionDialogComponent implements OnInit {
  selectedOption: boolean = true;
  options: any[] = [
    { label: 'Follow', value: true },
    // { label: 'Delete all wallets of this type', value: false },
  ];

  constructor(
    public dialogRef: MatDialogRef<ConfirmTransactionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: iData
  ) {}

  ngOnInit() {}

  closeDialog(bool: boolean) {
    this.dialogRef.close({ yes: bool, type: this.selectedOption });
  }
}
