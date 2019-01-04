import { <%= utils.classify(name) %>Pipe } from './<%= name %>.pipe';

export const <%= utils.sanitize(feature).toUpperCase() %>_PIPES = [
  <%= utils.classify(name) %>Pipe
];

export * from  './<%= name %>.pipe';
