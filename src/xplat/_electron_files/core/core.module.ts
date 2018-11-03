import { NgModule, Optional, SkipSelf } from '@angular/core';

import { throwIfAlreadyLoaded } from '@<%= npmScope %>/utils';
import { <%= utils.classify(prefix) %>CoreModule } from '@<%= npmScope %>/web';
import { ELECTRON_PROVIDERS } from './services';

@NgModule({
  imports: [
    <%= utils.classify(prefix) %>CoreModule,
  ],
  providers: [
    ...ELECTRON_PROVIDERS
  ]
})
export class <%= utils.classify(prefix) %>ElectronCoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: <%= utils.classify(prefix) %>ElectronCoreModule
  ) {
    throwIfAlreadyLoaded(parentModule, '<%= utils.classify(prefix) %>ElectronCoreModule');
  }
}
