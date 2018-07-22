import { <%= utils.classify(name) %>Pipe } from './<%= name %>.pipe';

export const <%= utils.sanitize(name).toUpperCase() %>_PIPES = [<%= utils.classify(name) %>Pipe];
