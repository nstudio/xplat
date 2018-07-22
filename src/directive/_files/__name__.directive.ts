import { Directive } from '@angular/core';

@Directive({ 
  name: '[<%= name %>]'
})
export class <%= utils.classify(name) %>Directive {

  constructor() {

  }
}