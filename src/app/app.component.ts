import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AppUpdateService } from 'src/app/services/app-update.service';
//import 'gridstack/dist/gridstack.min.css';
//import 'gridstack/dist/gridstack-extra.css';

//import 'gridstack/dist/h5/gridstack-dd-native';

const network = environment.network;
const defaultThorVersion = environment.defaultThorVersion;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'DecentralFi';
  public dcf_networkPath = defaultThorVersion + '_' + network;

  constructor(private appUpdate: AppUpdateService) {
    localStorage.setItem('dcf-network', this.dcf_networkPath);
  }

  async ngOnInit(): Promise<void> {}
}
