import { Component } from '@angular/core';

import { HeaderBaseComponent } from '@<%= npmScope %>/features';

@Component({
  selector: '<%= prefix %>-ion-header',
  templateUrl: 'header.component.html'
})
export class HeaderComponent extends HeaderBaseComponent {

}
