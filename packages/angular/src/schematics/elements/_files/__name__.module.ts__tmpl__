import { NgModule, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { <%= componentSymbolList %> } from '<%= barrel %>';

@NgModule({
  imports: [BrowserModule],
  entryComponents: [
    <%= componentSymbolList %>
  ]
})
export class <%= utils.classify(name) %>Module {
  constructor(private injector: Injector) {
    
  }

  ngDoBootstrap() {
    <%= customElementList %>
  }
}
