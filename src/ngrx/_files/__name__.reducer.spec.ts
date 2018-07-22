import { <%= utils.classify(name) %>Actions } from './<%= name %>.actions';
import { <%= name %>Reducer } from './<%= name %>.reducer';
import { <%= utils.classify(name) %>State } from './<%= name %>.state';

describe('<%= name %>Reducer', () => {
  it('should work', () => {
    const action: <%= utils.classify(name) %>Actions.Loaded = new <%= utils.classify(name) %>Actions.Loaded({});
    const actual = <%= name %>Reducer(<%= utils.classify(name) %>State.initialState, action);
    expect(actual).toEqual({});
  });
});
