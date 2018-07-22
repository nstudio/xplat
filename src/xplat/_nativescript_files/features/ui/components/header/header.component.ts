import { Component } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';

import { HeaderBaseComponent } from '@<%= npmScope %>/features';

@Component({
  moduleId: module.id,
  selector: '<%= prefix %>-header',
  templateUrl: 'header.component.html'
})
export class HeaderComponent extends HeaderBaseComponent {

  constructor(
    private router: RouterExtensions,
  ) {
    super();
  }
}
