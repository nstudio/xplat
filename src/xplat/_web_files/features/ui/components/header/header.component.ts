import { Component } from '@angular/core';

import { HeaderBaseComponent } from '@<%= npmScope %>/features';

@Component({
  selector: '<%= prefix %>-header',
  templateUrl: 'header.component.html'
})
export class HeaderComponent extends HeaderBaseComponent {

}
