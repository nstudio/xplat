import { BaseComponent } from '@<%= npmScope %>/core';

export abstract class <%= utils.classify(name) %>BaseComponent extends BaseComponent {
  
  public text: string = '<%= utils.classify(name) %>';
  
  constructor() {
    super();
  }
}