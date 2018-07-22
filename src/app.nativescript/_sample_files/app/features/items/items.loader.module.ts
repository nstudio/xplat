// from workaround:
// https://github.com/angular/angular-cli/issues/6373#issuecomment-319116889

import { NgModule } from '@angular/core';

// libs
import { NativeScriptRouterModule } from 'nativescript-angular/router';
import { routeItems } from '@<%= npmScope %>/features';
import { ItemsModule, ItemsComponent, ItemDetailComponent } from '@<%= npmScope %>/nativescript';

@NgModule({
  imports: [
    ItemsModule,
    NativeScriptRouterModule.forChild(
      routeItems(ItemsComponent, ItemDetailComponent)
    )
  ]
})
export class ItemsModuleLoader {}
