import { Component } from '@angular/core';
<% if (setupSandbox) { %>import { RouterExtensions } from 'nativescript-angular/router';<% } %>
import { BaseComponent } from '@<%= npmScope %>/core';

@Component({
  moduleId: module.id,
  selector: '<%= prefix %>-home',
  templateUrl: './home.component.html'
})
export class HomeComponent extends BaseComponent {
<% if (setupSandbox) { %>
  constructor(private _routerExt: RouterExtensions) {

  }

  // for quick sandbox feature creation
  goTo(route: string) {
    this._routerExt.navigate([route]);
  }
<% } %>
}
