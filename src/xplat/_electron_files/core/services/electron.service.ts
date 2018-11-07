import { Injectable } from '@angular/core';
import { LogService, WindowService } from '@<%= npmScope %>/core';
import { isElectron } from '@<%= npmScope %>/utils';
import * as childProcess from 'child_process';
import { ipcRenderer } from 'electron';

@Injectable()
export class ElectronService {

  private _ipc: typeof ipcRenderer;
  private _childProcess: typeof childProcess;

  constructor(
    private _log: LogService,
    private _win: WindowService
  ) {
    // Conditional imports
    if (isElectron()) {
      this._ipc = this._win.require('electron').ipcRenderer;
      this._childProcess = this._win.require('child_process');
      this._log.debug('ElectronService ready.');
    }
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
