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
  TemplateOptions,
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
  updateJsonFile,
  formatFiles
} from "../utils";
import { Schema as ApplicationOptions } from "./schema";

let appName: string;
export default function(options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      `Missing name argument. Provide a name for your web app. Example: ng g app my-app`
    );
  }
  appName = options.name;
  options.name = `web-${options.name}`;

  // ensure sass is used
  options.style = "scss";

  // use src dir
  options.sourceDir = "src";
  // sample
  const sample = options.sample;
  const routing = options.routing;

  return chain([
    prerun(options.prefix),
    externalSchematic("@nrwl/schematics", "app", options),
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options)(tree, context),
    (tree: Tree, context: SchematicContext) =>
      sample || routing
      ? addAppFiles(options, sample ? "sample" : "routing")(tree, context)
      : noop()(tree, context),
    // adjust app files
    (tree: Tree) => adjustAppFiles(options, tree),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      scripts[
        `clean`
      ] = `npx rimraf hooks node_modules package-lock.json && npm i`;
      scripts[`start.web.${appName}`] = `ng serve ${options.name}`;
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
        template(<TemplateOptions>{
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
      <h2>
        Welcome to an Angular CLI app built with Nrwl Nx and xplat!
      </h2>
      <img width="100" src="assets/nx-logo.png">
      <span style="position: relative;top: -28px;margin: 10px;">+</span>
      <img width="120" src="assets/xplat.png">
    </div>
  
    <h2>Nx</h2>
  
    An open source toolkit for enterprise Angular applications. Nx is designed to help you create and build enterprise grade
    Angular applications. It provides an opinionated approach to application project structure and patterns.
  
    <h3>Quick Start & Documentation</h3>
  
    <a href="https://nrwl.io/nx">Watch a 5-minute video on how to get started with Nx.</a>
  
    <h1>{{'hello' | translate}}</h1>
    <h3>Try things out</h3>
  
    <a href="https://nstudio.io/xplat">Learn more about xplat.</a>
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
    'should render title in a h1 tag',
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

        expect(compiled.querySelector('h1').textContent).toContain(
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
