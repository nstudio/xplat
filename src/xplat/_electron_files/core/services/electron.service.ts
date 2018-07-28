import { Injectable } from '@angular/core';
import * as childProcess from 'child_process';
import { ipcRenderer } from 'electron';

declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}
declare var window: Window;
interface Window {
  process: any;
  require: any;
}

@Injectable()
export class ElectronService {

  private _ipc: typeof ipcRenderer;
  private childProcess: typeof childProcess;

  constructor() {
    // Conditional imports
    if (this.isElectron()) {
      this._ipc = window.require('electron').ipcRenderer;
      this.childProcess = window.require('child_process');
    }
  }

  public isElectron() {
    return window && window.process && window.process.type;
  }

  public on(channel: string, listener: Function): void {
    if (!this._ipc) {
      return;
    }

    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args): void {
    if (!this._ipc) {
      return;
    }

    this._ipc.send(channel, ...args);
  }

}
