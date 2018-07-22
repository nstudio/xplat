// angular
import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';

// nativescript
import { NativeScriptRouterModule } from 'nativescript-angular/router';

// libs
import { routeBase } from '@<%= npmScope %>/features';

// app
import { SharedModule } from './features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    NativeScriptRouterModule.forRoot(
      routeBase({
        base: '~/features/items/items.loader.module#ItemsModuleLoader'
      })
    )
  ]
})
export class AppRoutingModule {}
