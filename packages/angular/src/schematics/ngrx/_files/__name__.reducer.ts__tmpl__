import { Action } from '@ngrx/store';
import { <%= utils.classify(name) %>Actions } from './<%= name %>.actions';
import { <%= utils.classify(name) %>State } from './<%= name %>.state';

export function <%= name %>Reducer(state = <%= utils.classify(name) %>State.initialState, action: <%= utils.classify(name) %>Actions.Actions): <%= utils.classify(name) %>State.IState {
  switch (action.type) {
    case <%= utils.classify(name) %>Actions.Types.INIT:
      return state;

    case <%= utils.classify(name) %>Actions.Types.LOADED: {
      return { ...state, ...action.payload };
    }

    default:
      return state;
  }
}
