import { NgModule } from '@angular/core';

// xplat
import { <%= utils.classify(prefix) %>CoreModule } from '@<%= npmScope %>/web';

@NgModule({
  imports: [<%= utils.classify(prefix) %>CoreModule]
})
export class CoreModule {}
