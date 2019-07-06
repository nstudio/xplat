import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { DataPersistence } from '@nrwl/nx';
import { hot } from '@nrwl/nx/testing';

import { <%= utils.classify(name) %>Effects } from './<%= name %>.effects';
import { <%= utils.classify(name) %>Actions } from './<%= name %>.actions';

import { Observable } from 'rxjs';

describe('<%= utils.classify(name) %>Effects', () => {
  let actions$: Observable<any>;
  let effects$: <%= utils.classify(name) %>Effects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({})],
      providers: [
        <%= utils.classify(name) %>Effects,
        DataPersistence,
        provideMockActions(() => actions$)
      ]
    });

    effects$ = TestBed.get(<%= utils.classify(name) %>Effects);
  });

  describe('someEffect', () => {
    it('should work', () => {
      actions$ = hot('-a-|', { a: new <%= utils.classify(name) %>Actions.Load({}) });
      expect(effects$.load$).toBeObservable(
        hot('-a-|', { a: new <%= utils.classify(name) %>Actions.Loaded({}) })
      );
    });
  });
});
