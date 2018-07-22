import { <%= utils.classify(name) %>Component } from './<%= name %>/<%= name %>.component';

export const <%= utils.sanitize(name).toUpperCase() %>_COMPONENTS = [
  <%= utils.classify(name) %>Component
];

export * from './<%= name %>/<%= name %>.component';