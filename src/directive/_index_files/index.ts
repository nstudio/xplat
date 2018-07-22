import { <%= utils.classify(name) %>Directive } from './<%= name %>.directive';

export const <%= utils.sanitize(name).toUpperCase() %>_DIRECTIVES = [<%= utils.classify(name) %>Directive];
