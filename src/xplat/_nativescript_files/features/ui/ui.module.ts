import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
import { UISharedModule } from '@<%= npmScope %>/features';
import { UI_COMPONENTS } from './components';

const MODULES = [
  NativeScriptCommonModule, 
  NativeScriptFormsModule, 
  NativeScriptRouterModule, 
  TNSFontIconModule,
  UISharedModule,
];

@NgModule({
  imports: [
    ...MODULES
  ],
  declarations: [
    ...UI_COMPONENTS
  ],
  exports: [
    ...MODULES, 
    ...UI_COMPONENTS
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class UIModule {}
