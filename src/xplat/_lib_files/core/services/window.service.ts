// angular
import { Injectable, ViewContainerRef } from '@angular/core';

// app
import { isObject, isNativeScript } from '@<%= npmScope %>/utils';

@Injectable()
export class WindowPlatformService {
  public navigator: any = {};
  public location: any = {};
  public localStorage: any;
  public alert(msg: any) {}
  public confirm(msg: any) {}
  public setTimeout(handler: (...args: any[]) => void, timeout?: number) {
    return 0;
  }
  public clearTimeout(timeoutId: number) {}
  public setInterval(handler: (...args: any[]) => void, ms?: number, ...args: any[]) {
    return 0;
  }
  public clearInterval(intervalId: number) {}

  // ...You can expand support for more window methods as you need them here...
}

@Injectable()
export class WindowService {

  constructor(private _platformWindow: WindowPlatformService) {}

  public get navigator() {
    return this._platformWindow.navigator;
  }

  public get location() {
    return this._platformWindow.location;
  }

  public alert(msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const result: any = this._platformWindow.alert(msg);
      if (isObject(result) && result.then) {
        // console.log('WindowService -- using result.then promise');
        result.then(resolve, reject);
      } else {
        resolve();
      }
    });
  }

  public confirm(msg: any, action?: Function /* used for fancyalerts on mobile*/): Promise<any> {
    return new Promise((resolve, reject) => {
      const result: any = (<any>this._platformWindow).confirm(msg, isNativeScript() ? action : undefined);
      if (isObject(result) && result.then) {
        result.then(resolve, reject);
      } else if (result) {
        resolve();
      } else {
        reject();
      }
    });
  }

  public setTimeout(handler: (...args: any[]) => void, timeout?: number): number {
    return this._platformWindow.setTimeout(handler, timeout);
  }

  public clearTimeout(timeoutId: number): void {
    return this._platformWindow.clearTimeout(timeoutId);
  }

  public setInterval(handler: (...args: any[]) => void, ms?: number, ...args: any[]): number {
    return this._platformWindow.setInterval(handler, ms, args);
  }

  public clearInterval(intervalId: number): void {
    return this._platformWindow.clearInterval(intervalId);
  }
}
