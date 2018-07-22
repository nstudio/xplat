import { Component } from '@angular/core';

// libs
import { AppBaseComponent, AppService } from '@<%= npmScope %>/nativescript';

@Component({
  selector: '<%= prefix %>-root',
  template: `<%
  if (routing || sample) { %>
  <page-router-outlet></page-router-outlet><%
  } else { %>
    <StackLayout class="page p-20">
      <Label automationText="helloLabel" [text]="'hello' | translate" class="h1 p-10 text-center"></Label>
    </StackLayout><%
  } %>`
})
export class AppComponent extends AppBaseComponent {

  constructor(
    appService: AppService
  ) {
    super(appService);
  }
}
