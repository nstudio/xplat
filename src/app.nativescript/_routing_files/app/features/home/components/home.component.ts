import { Component } from '@angular/core';

import { BaseComponent } from '@<%= npmScope %>/core';

@Component({
  moduleId: module.id,
  selector: '<%= prefix %>-home',
  templateUrl: './home.component.html'
})
export class HomeComponent extends BaseComponent {}
