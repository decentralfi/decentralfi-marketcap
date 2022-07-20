import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { consoleLog } from '@app/utils/consoles';
import { filter, map } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class AppUpdateService {
  constructor(private readonly updates: SwUpdate) {
    this.updates.available.subscribe((event) => {
      consoleLog('App Update available. Reloading...');
      this.doAppUpdate();
    });

    /*const updatesAvailable = updates.versionUpdates.pipe(
    filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
    map(evt => ({
    type: 'UPDATE_AVAILABLE',
    current: evt.currentVersion,
    available: evt.latestVersion,
    })));*/
  }
  /*showAppUpdateAlert() {
  const header = 'App Update available';
  const message = 'Choose Ok to update';
  const action = this.doAppUpdate;
  const caller = this;
  // Use MatDialog or ionicframework's AlertController or similar
  presentAlert(header, message, action, caller);
}*/
  doAppUpdate() {
    this.updates.activateUpdate().then(() => document.location.reload());
  }
}
