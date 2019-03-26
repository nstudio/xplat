import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { <%= utils.classify(name) %>Module } from '../<%= name %>.module';

platformBrowserDynamic()
  .bootstrapModule(<%= utils.classify(name) %>Module)
  .catch(err => console.log(err));
