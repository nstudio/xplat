import { DOCUMENT } from '@angular/common';
import { Route } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ENVIRONMENT_TOKEN } from '@<%= npmScope %>/core';
import { <%= utils.classify(prefix) %>CoreModule, UIModule } from '@<%= npmScope %>/nativescript';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { NxModule } from '@nrwl/nx';
import { NativeScriptDocument } from 'nativescript-angular/platform-common';

export const TNS_TEST_PROVIDERS = (environment: any = {}) => [
  {
    provide: ENVIRONMENT_TOKEN,
    useValue: environment,
  },
  {
    // DOCUMENT must be injected manually for RouterTestingModule to work.
    provide: DOCUMENT,
    useClass: NativeScriptDocument,
  },
];

export const TNS_TEST_IMPORTS = (routes: Route[] = [], metaReducers = []) => [
  RouterTestingModule.withRoutes(routes),
  <%= utils.classify(prefix) %>CoreModule,
  UIModule,
  NxModule.forRoot(),
  StoreModule.forRoot({}, { metaReducers }),
  EffectsModule.forRoot([]),
];
