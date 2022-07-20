import { Component, OnInit } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NewsletterService} from '../services/newsletter.service';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  public email = new FormControl('', [Validators.required, Validators.email]);
  public period = 'last24hr';
  public pools = [{asset: { chain: 'THOR', symbol: 'THOR', ticker:'THOR', iconPath: 'https://unpkg.com/cryptoicons-cdn@0.1.22/images/RUNE.png' }, depth: 0, value: 0}];
  public faQuestionCircle = faQuestionCircle;
  public selectedParam: string = 'roi';
  public valueLabel: string = '';
  public options: any;
  public chartTheme: string = '';
  public chartThemePaginator: string = '';
  public depth: any;

  constructor(
    private newsletterService: NewsletterService,
    private _snackBar: MatSnackBar) {     }

  ngOnInit() {
  }

  registerEmail(){
    if (this.email.hasError('required')) {
      return 'You must enter a value';
    }

    if (this.email.hasError('email')) {
      return 'Not a valid email';
    }

    this.newsletterService.registerEmail(this.email.value).subscribe({next: (data: any) => {
      if(data.details){
        this.openSnackBar(this.email.value + ' is already subcribed')
        console.error(data);
      }else{
        this.openSnackBar(this.email.value + ' subscribed successfully')
      }
    }});
    return;
  }

  openSnackBar(msg: string){
    //TODO: snackBar must open and show msg
    this._snackBar.open(msg, '', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  getErrorMessage() {
    if (this.email.hasError('required')) {
      return 'You must enter a value';
    }

    return this.email.hasError('email') ? 'Not a valid email' : '';
  }

}
