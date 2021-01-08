import { Injectable } from '@angular/core';
import { Device, isIOS, Dialogs, AlertOptions, ConfirmOptions } from '@nativescript/core';
import * as timer from '@nativescript/core/timer';

@Injectable({
  providedIn: 'root'
})
export class MobileWindowService {
  private _dialogOpened = false;

  get navigator(): any {
    return {
      language: Device.language,
      userAgent: 'nativescript'
    };
  }
  get location(): any {
    return {
      host: 'nativescript'
    };
  }

  alert(msg: string): Promise<void> {
    return new Promise(resolve => {
      if (!this._dialogOpened && msg) {
        this._dialogOpened = true;
        if (typeof msg === 'string') {
          const options: AlertOptions = {
            message: <string>msg,
            okButtonText: 'Ok'
          };
          Dialogs.alert(options).then(ok => {
            this._dialogOpened = false;
            resolve();
          });
        }
      }
    });
  }

  confirm(message: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._dialogOpened) {
        this._dialogOpened = true;
        const options: ConfirmOptions = {
          title: 'Confirm',
          message,
          okButtonText: 'Ok',
          cancelButtonText: 'Cancel'
        };

        Dialogs.confirm(options).then(ok => {
          this._dialogOpened = false;
          if (ok) {
            resolve();
          } else {
            reject();
          }
        });
      }
    });
  }

  // helps ensure return value is a number and not a zone wrapped value
  public setTimeout(
    handler: (...args: any[]) => void,
    timeout?: number
  ): number {
    return timer.setTimeout(handler, timeout);
  }
  public clearTimeout(timeoutId: number): void {
    timer.clearTimeout(timeoutId);
  }
  public setInterval(
    handler: (...args: any[]) => void,
    ms?: number,
    ...args: any[]
  ): number {
    return timer.setInterval(handler, ms);
  }
  public clearInterval(intervalId: number): void {
    timer.clearInterval(intervalId);
  }
}
