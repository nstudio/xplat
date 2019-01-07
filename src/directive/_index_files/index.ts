import { <%= utils.classify(name) %>Directive } from './<%= name %>.directive';

<% if (feature) { %>
  export const <%= utils.sanitize(feature).toUpperCase() %>_DIRECTIVES = [
<% } else { %>
export const DIRECTIVES = [
<% } %>
    <%= utils.classify(name) %>Directive
];
