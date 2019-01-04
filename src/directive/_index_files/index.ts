import { <%= utils.classify(name) %>Directive } from './<%= name %>.directive';

export const <%= utils.sanitize(feature).toUpperCase() %>_DIRECTIVES = [
  <%= utils.classify(name) %>Directive
];

export * from './<%= name %>.directive';
