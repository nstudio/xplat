import { OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

// libs
import { LogService, BaseComponent } from '@<%= npmScope %>/core';
import { isObject } from '@<%= npmScope %>/utils';

// app
import { Item } from '../models';
import { ItemService } from '../services/item.service';

export abstract class ItemDetailBaseComponent extends BaseComponent implements OnInit, OnDestroy {

  public item: Item;

  constructor(
    protected log: LogService,
    protected itemService: ItemService,
    protected route: ActivatedRoute,
  ) {
    super();
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.log.debug('ItemDetailBaseComponent ngOnInit id:', id);
    this.item = this.itemService.getItem(id);
  }
}
