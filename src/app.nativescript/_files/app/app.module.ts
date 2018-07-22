// angular
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

// app
import { CoreModule } from './core/core.module';
import { SharedModule } from './features/shared/shared.module';<% if (routing || sample) { %>
import { AppRoutingModule } from './app.routing';<% } %>
import { AppComponent } from './app.component';

@NgModule({
  imports: [CoreModule, SharedModule<% if (routing || sample) { %>, AppRoutingModule<% } %>],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule {}
