import { <%= utils.classify(name) %>Service } from './<%= name %>.service';

export const <%= utils.sanitize(name).toUpperCase() %>_PROVIDERS = [<%= utils.classify(name) %>Service];

export * from './<%= name %>.service';
