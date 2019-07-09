// https://github.com/NativeScript/nativescript-dev-webpack/issues/660#issuecomment-422711983
import 'reflect-metadata';
import { platformNativeScriptDynamic } from 'nativescript-angular/platform';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app.module';

// If built with env.uglify
declare const __UGLIFIED__;
if (typeof __UGLIFIED__ !== 'undefined' && __UGLIFIED__) {
  require('@angular/core').enableProdMode();
}

platformNativeScriptDynamic().bootstrapModule(AppModule);
