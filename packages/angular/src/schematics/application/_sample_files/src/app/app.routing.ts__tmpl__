// angular
import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

// libs
import { routeBase } from '@<%= npmScope %>/features';

// app
import { SharedModule } from './features/shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forRoot(
      routeBase({
        base: './features/items/items.loader.module#ItemsLoaderModule'
      }),
      { preloadingStrategy: PreloadAllModules }
    )
  ]
})
export class AppRoutingModule {}
