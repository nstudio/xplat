import { Component } from '@angular/core';

import { isCapacitorNative } from '@ionic/core';
import { Platform } from '@ionic/angular';
import { Plugins, StatusBarStyle } from '@capacitor/core';
const { StatusBar } = Plugins;

@Component({
  selector: '<%= prefix %>-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        StatusBar.setStyle({
          style: StatusBarStyle.Dark
        });
      }
    });
  }
}


