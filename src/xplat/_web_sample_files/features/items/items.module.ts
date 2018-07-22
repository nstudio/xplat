import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// libs
import { routeItems } from '@<%= npmScope %>/features';
import { UIModule } from '../ui/ui.module';

// app
import { ITEM_COMPONENTS, ItemsComponent, ItemDetailComponent } from './components';

@NgModule({
  imports: [
    UIModule, 
    RouterModule.forChild(routeItems(
      ItemsComponent, 
      ItemDetailComponent, 
    ))
  ],
  declarations: [...ITEM_COMPONENTS],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ItemsModule {}
