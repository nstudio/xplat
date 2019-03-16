import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { <%= componentSymbolList %> } from '<%= barrel %>';

@NgModule({
  imports: [],
  exports: [],
  declarations: [],
  entryComponents: [
    <%= componentSymbolList %>
  ],
  providers: []
})
export class <%= utils.classify(name) %>Module {
  constructor(injector: Injector) {
    <%= customElementList %>
  }

  ngDoBootstrap() {}
}
