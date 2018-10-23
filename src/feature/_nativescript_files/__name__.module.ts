import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';<% if (!onlyModule && onlyProject && routing) { %>
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';<% } %>
import { <%= utils.classify(name) %>Module as Shared<%= utils.classify(name) %>Module } from '@<%= npmScope %>/features';
<% if (onlyProject) { %>
import { SharedModule } from '../shared/shared.module';<% } else { %>
import { UIModule } from '../ui/ui.module';<% } if (!onlyModule) { %>
import { <%= utils.sanitize(name).toUpperCase() %>_COMPONENTS<% if (onlyProject && routing) { %>, <%= utils.classify(name) %>Component<% } %> } from './components';
<% if (onlyProject && routing) { %>
export const routes: Routes = [
  {
    path: '',
    component: <%= utils.classify(name) %>Component
  }
];<% } } %>

@NgModule({
  imports: [
    Shared<%= utils.classify(name) %>Module,
    <% if (onlyProject) { %>SharedModule<% if (routing) { %>,
    NativeScriptRouterModule.forChild(routes)<% } } else { %>UIModule<% } %>
  ],<% if (!onlyModule) { %>
  declarations: [
    ...<%= utils.sanitize(name).toUpperCase() %>_COMPONENTS
  ],
  exports: [
    ...<%= utils.sanitize(name).toUpperCase() %>_COMPONENTS
  ],<% } %>
  schemas: [NO_ERRORS_SCHEMA]
})
export class <%= utils.classify(name) %>Module {}
