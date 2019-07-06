import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { <%= utils.classify(name) %>Actions } from './<%= name %>.actions';
import { <%= utils.classify(name) %>State } from './<%= name %>.state';
import { DataPersistence } from '@nrwl/nx';

@Injectable()
export class <%= utils.classify(name) %>Effects {

  @Effect()
  load$ = this.dataPersistence.fetch(<%= utils.classify(name) %>Actions.Types.LOAD, {
    run: (action: <%= utils.classify(name) %>Actions.Load, state: <%= utils.classify(name) %>State.IState) => {
      return new <%= utils.classify(name) %>Actions.Loaded(state);
    },

    onError: (action: <%= utils.classify(name) %>Actions.Load, error) => {
      console.error('Error', error);
    }
  });

  constructor(
    private actions$: Actions,
    private dataPersistence: DataPersistence<<%= utils.classify(name) %>State.IState>
  ) {}
}
