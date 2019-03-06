import {
  apply,
  chain,
  Tree,
  Rule,
  url,
  move,
  template,
  mergeWith,
  branchAndMerge,
  SchematicContext,
  SchematicsException,
  externalSchematic,
  noop
} from "@angular-devkit/schematics";

import {
  stringUtils,
  prerun,
  updatePackageScripts,
  getNpmScope,
  getPrefix,
  getJsonFromFile,
  applyAppNamingConvention,
  updateJsonFile,
  formatFiles,
  missingNameArgument
} from "../utils";
import { Schema as ApplicationOptions } from "./schema";

let appName: string;
export default function(options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingNameArgument('Provide a name for your Web app.', 'ng g app my-app')
    );
  }
  appName = options.name;

  // ensure sass is used
  options.style = "scss";

  return chain([
    prerun(options),
    // adjust naming convention
    applyAppNamingConvention(options, 'web'),
    (tree: Tree, context: SchematicContext) => externalSchematic("@nrwl/schematics", "app", {
      ...options,
      skipInstall: true
    })(tree, context),
    (tree: Tree) => addAppFiles(options),
    (tree: Tree, context: SchematicContext) =>
      options.sample || options.routing
      ? addAppFiles(options, options.sample ? "sample" : "routing")(tree, context)
      : noop()(tree, context),
    // adjust app files
    (tree: Tree) => adjustAppFiles(options, tree),
    // add start/clean scripts
    (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      const scripts = {};
      scripts[
        `clean`
      ] = `npx rimraf hooks node_modules package-lock.json && npm i`;
      scripts[`start.${platformApp}`] = `ng serve ${options.name}`;
      return updatePackageScripts(tree, scripts);
    },
    options.skipFormat 
      ? noop()
      : formatFiles(options)
  ]);
}

function addAppFiles(options: ApplicationOptions, extra: string = ""): Rule {
  extra = extra ? `${extra}_` : "";
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: ".",
          utils: stringUtils
        }),
        move(`apps/${options.name}`)
      ])
    )
  );
}

function adjustAppFiles(options: ApplicationOptions, tree: Tree) {
  tree.overwrite(`/apps/${options.name}/src/index.html`, indexContent());
  tree.overwrite(`/apps/${options.name}/src/main.ts`, mainContent());
  tree.overwrite(
    `/apps/${options.name}/src/styles.scss`,
    `@import 'scss/index';`
  );
  tree.overwrite(
    `/apps/${options.name}/src/app/app.component.html`,
    options.sample || options.routing
      ? `<router-outlet></router-outlet>`
      : appCmpHtml()
  );
  if (options.sample || options.routing) {
    // update home route to reflect with root cmp would have been
    tree.overwrite(
      `/apps/${options.name}/src/app/features/home/components/home.component.html`,
      appCmpHtml()
    );
  }
  tree.overwrite(
    `/apps/${options.name}/src/app/app.component.ts`,
    appCmpContent()
  );
  tree.overwrite(
    `/apps/${options.name}/src/app/app.component.spec.ts`,
    appCmpSpec()
  );
  tree.overwrite(
    `/apps/${options.name}/src/app/app.module.ts`,
    appModuleContent(options)
  );
  // update cli config for shared web specific scss
  const ngConfig = getJsonFromFile(tree, "angular.json");
  // find app
  if (ngConfig && ngConfig.projects) {
    if (ngConfig.projects[options.name]) {
      if (ngConfig.projects[options.name].architect) {
        ngConfig.projects[options.name].architect.build.options.styles = [
          "xplat/web/scss/_index.scss",
          `apps/${options.name}/src/styles.scss`
        ];
      }
    }
  }
  return updateJsonFile(tree, "angular.json", ngConfig);
}

function indexContent() {
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${getNpmScope()} ${appName}</title>
    <base href="/">

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
    <${getPrefix()}-root></${getPrefix()}-root>
</body>
</html>`;
}

function mainContent() {
  return `import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// libs
import { environment } from '@${getNpmScope()}/core';

// app
import { AppModule } from './app/app.module';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.log(err));
`;
}

function appCmpHtml() {
  return `<div class="p-x-20">
    <div style="text-align:center">
      <h1>
        Welcome to ${appName}!
      </h1>
      <h3>
        An Angular CLI app built with Nrwl Nx and xplat.
      </h3>
      <img width="100" src="assets/nx-logo.png">
      <span style="position: relative;top: -28px;margin: 10px;">+</span>
      <img width="120" src="assets/xplat.png">
    </div>
  
    <h3>Nx</h3>
  
    An open source toolkit for enterprise Angular applications. Nx is designed to help you create and build enterprise grade
    Angular applications. It provides an opinionated approach to application project structure and patterns.
  
    <h3>Quick Start & Documentation</h3>
  
    <a href="https://nrwl.io/nx" target="_blank">Watch a 5-minute video on how to get started with Nx.</a>
  
    <h2>{{'hello' | translate}}</h2>
    <h3>Try things out</h3>
  
    <a href="https://nstudio.io/xplat/generators/" target="_blank">Learn more about xplat generators.</a>
  </div>`;
}

function appCmpContent() {
  return `import { Component } from '@angular/core';

// xplat
import { AppBaseComponent } from '@${getNpmScope()}/web';

@Component({
    selector: '${getPrefix()}-root',
    templateUrl: './app.component.html'
})
export class AppComponent extends AppBaseComponent {

    constructor() {
        super();
    }
}
`;
}

function appCmpSpec() {
  return `import { TestBed, async } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app.component';

const translationsEn = require('../assets/i18n/en.json');
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient);
}

describe('AppComponent', () => {
    let translate: TranslateService;
    let http: HttpTestingController;

    beforeEach(
    async(() => {
        TestBed.configureTestingModule({
        imports: [
            HttpClientTestingModule,
            TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient]
            }
            })
        ],
        declarations: [AppComponent],
        providers: [TranslateService]
        }).compileComponents();
        translate = TestBed.get(TranslateService);
        http = TestBed.get(HttpTestingController);
    })
    );
    it(
    'should create the app',
    async(() => {
        const fixture = TestBed.createComponent(AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    })
    );
    it(
    'should render xplat hello in a h2 tag',
    async(() => {
        spyOn(translate, 'getBrowserLang').and.returnValue('en');
        translate.use('en');
        const fixture = TestBed.createComponent(AppComponent);
        const compiled = fixture.debugElement.nativeElement;

        // the DOM should be empty for now since the translations haven't been rendered yet
        expect(compiled.querySelector('h1').textContent).toEqual('');

        http.expectOne('/assets/i18n/en.json').flush(translationsEn);

        // Finally, assert that there are no outstanding requests.
        http.verify();
        fixture.detectChanges();

        expect(compiled.querySelector('h2').textContent).toContain(
        'Hello xplat'
        );
    })
    );
});   
`;
}

function appModuleContent(options) {
  return `import { NgModule } from '@angular/core';

// libs
import { environment } from '@${getNpmScope()}/core';

// app
import { CoreModule } from './core/core.module';
import { SharedModule } from './features/shared/shared.module';
${
    options.sample || options.routing
      ? `import { AppRoutingModule } from './app.routing';`
      : ""
  }
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        CoreModule,
        SharedModule${
          options.sample || options.routing
            ? `,
        AppRoutingModule`
            : ""
        }
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {}
`;
}
