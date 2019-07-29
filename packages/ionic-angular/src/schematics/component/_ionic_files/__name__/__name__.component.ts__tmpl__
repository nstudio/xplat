import { Component } from '@angular/core';

<% if (onlyProject || !createBase) { %>import { BaseComponent } from '@<%= npmScope %>/core';<%
} else { %>import { <%= utils.classify(name) %>BaseComponent } from '@<%= npmScope %>/features';<% } %>

@Component({
  selector: '<%= prefix %>-<%= name %>',
  templateUrl: '<%= name %>.component.html'
})
export class <%= utils.classify(name) %>Component extends <%= onlyProject || !createBase ? '' : utils.classify(name) %>BaseComponent {

  constructor() {
    super();
  }
}