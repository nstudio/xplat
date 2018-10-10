import { async } from '@angular/core/testing';
import { TNS_TEST_IMPORTS, TNS_TEST_PROVIDERS } from '@lyt3/nativescript/testing';
import {
  nsTestBedAfterEach,
  nsTestBedBeforeEach,
  nsTestBedRender
} from 'nativescript-angular/testing';
import { <%= utils.classify(name) %>Component } from './<%= name %>.component';

describe('<%= utils.classify(name) %>Component', () => {
  beforeEach(
    nsTestBedBeforeEach(
      [<%= utils.classify(name) %>Component],
      [...TNS_TEST_PROVIDERS()],
      [...TNS_TEST_IMPORTS()],
    )
  );

  afterEach(nsTestBedAfterEach(false));

  it('Component should load', async(() => {
    return nsTestBedRender(<%= utils.classify(name) %>Component).then(fixture => {
      if (!(fixture.componentInstance instanceof <%= utils.classify(name) %>Component)) {
        throw new Error('Component not loaded');
      }
    });
  }));
});
