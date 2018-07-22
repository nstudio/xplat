import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// libs
import { LogService } from '@<%= npmScope %>/core';
import { ItemService, ItemDetailBaseComponent } from '@<%= npmScope %>/features';

@Component( {
  selector: '<%= prefix %>-item-detail',
  templateUrl: './item-detail.component.html'
} )
export class ItemDetailComponent extends ItemDetailBaseComponent {
  
  constructor(
    log: LogService,
    itemService: ItemService,
    route: ActivatedRoute
  ) {
    super(log, itemService, route);
  }
}
