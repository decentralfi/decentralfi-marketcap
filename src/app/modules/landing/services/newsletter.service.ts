import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable()
export class NewsletterService {

  private endpointUrl = environment.endpoint;

  constructor(private http: HttpClient) { }

  registerEmail(email: string) {

    let emailObj = {email}
    return this.http.post(this.endpointUrl + 'newsletter/',emailObj);
  }

}
