import { Component } from '@angular/core';

<% if (onlyProject || ignoreBase) { %>import { BaseComponent } from '@<%= npmScope %>/core';<%
} else { %>import { <%= utils.classify(name) %>BaseComponent } from '@<%= npmScope %>/features';<% } %>

@Component({
  moduleId: module.id,
  selector: '<%= prefix %>-<%= name %>',
  templateUrl: './<%= name %>.component.html'
})
export class <%= utils.classify(name) %>Component extends <%= onlyProject || ignoreBase ? '' : utils.classify(name) %>BaseComponent {

  constructor() {
    super();
  }
}