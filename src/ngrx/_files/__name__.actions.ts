import { Action } from '@ngrx/store';
import { <%= utils.classify(name) %>State } from './<%= name %>.state';

export namespace <%= utils.classify(name) %>Actions {
  export enum Types {
    INIT = '[@<%= npmScope %>/<%= name %>] Init',
    LOAD = '[@<%= npmScope %>/<%= name %>] Load',
    LOADED = '[@<%= npmScope %>/<%= name %>] Loaded',
  }

  export class Init implements Action {
    type: string = Types.INIT;
    payload: string = null;
  }

  export class Load implements Action {
    type: string = Types.LOAD;
    constructor(public payload: any) {}
  }

  export class Loaded implements Action {
    type: string = Types.LOADED;
    constructor(public payload: <%= utils.classify(name) %>State.IState) {}
  }

  export type Actions = Init | Load | Loaded;
}

