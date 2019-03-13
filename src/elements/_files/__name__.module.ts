import { NgModule, Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { SharedComponent, SharedComponentModule } from '@code-sharing/shared-component';

@NgModule({
  imports: [
    SharedComponentModule
  ],
  exports: [
    BrowserAnimationsModule
  ],
  declarations: [],
  entryComponents: [
    SharedComponent
  ],
  providers: []
})
export class <%= utils.classify(prefix) %>Module {
  constructor(injector: Injector) {
    const component = createCustomElement(SharedComponent, { injector });
    customElements.define('shared-component', component);
  }

  ngDoBootstrap() {}
}
