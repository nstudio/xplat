import { <%= utils.classify(name) %>Pipe } from './<%= name %>.pipe';

<% if (feature) { %>
export const <%= utils.sanitize(feature).toUpperCase() %>_PIPES = [
<% } else { %>
export const PIPES = [
<% } %>
   <%= utils.classify(name) %>Pipe
];

export * from  './<%= name %>.pipe';
