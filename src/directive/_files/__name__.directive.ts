import { Directive } from '@angular/core';

@Directive({ 
  selector: '[<%= name %>]'
})
export class <%= utils.classify(name) %>Directive {

  constructor() {

  }
}