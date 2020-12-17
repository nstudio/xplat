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
  noop,
  ExecutionOptions,
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import {
  stringUtils,
  updatePackageScripts,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
  readWorkspaceJson,
  updateWorkspace,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getJsonFromFile,
  updateJsonFile,
  supportedPlatforms,
  checkRootTsConfig,
} from '@nstudio/xplat-utils';
import { Schema } from './schema';

export default function (options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your app.',
        'nx g @nstudio/angular:app my-app'
      )
    );
  }
  if (options.useXplat) {
    // xplat is configured for sass only (at moment)
    options.style = 'scss';
  }

  return chain([
    prerun(options),
    // adjust naming convention
    XplatHelpers.applyAppNamingConvention(options, 'web'),
    // use xplat or not
    options.useXplat
      ? externalSchematic('@nstudio/angular', 'xplat', {
          platforms: 'web',
          framework: 'angular',
        })
      : noop(),
    (tree: Tree, context: SchematicContext) => {
      const nrwlWebOptions = {
        ...options,
        skipInstall: true,
      };
      let executionOptions: Partial<ExecutionOptions>;
      if (options.useXplat) {
        // when generating xplat architecture, ensure:
        // 1. sass is used
        nrwlWebOptions.style = 'scss';
        // executionOptions = {
        //   interactive: false
        // };
      }
      return externalSchematic(
        '@nrwl/angular',
        'app',
        nrwlWebOptions,
        executionOptions
      )(tree, context);
    },
    (tree: Tree, context: SchematicContext) =>
      addHeadlessE2e(options)(tree, context),
    options.useXplat
      ? (tree: Tree, context: SchematicContext) =>
          addAppFiles(options)(tree, context)
      : noop(),
    options.useXplat
      ? (tree: Tree, context: SchematicContext) =>
          addAppFiles(options, 'routing')(tree, context)
      : noop(),
    // adjust app files
    options.useXplat
      ? (tree: Tree, context: SchematicContext) => adjustAppFiles(options, tree)
      : noop(),
    // add start/clean scripts
    (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      const scripts = {};
      scripts[
        `clean`
      ] = `npx rimraf hooks node_modules package-lock.json && npm i`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      // make sure tsconfig exists at root
      // we do this here because Nrwl with 10.1 was actually removing it
      checkRootTsConfig(tree);
    },
    <any>formatFiles({ skipFormat: options.skipFormat }),
  ]);
}

/**
 * Add a Protractor config with headless Chrome and create a
 * target configuration to use the config created.
 *
 * @param options
 */
function addProtractorCiConfig(options: Schema) {
  return (tree: Tree, context: SchematicContext) => {
    const config = `
const defaultConfig = require('./protractor.conf').config;
defaultConfig.capabilities.chromeOptions = {
  args: ['--headless']
};

exports.config = defaultConfig;
    `;
    const directory = options.directory ? `${options.directory}/` : '';
    const e2eProjectName = `${options.name}-e2e`;
    const confFile = 'protractor.headless.js';
    tree.create(`/apps/${directory}${e2eProjectName}/${confFile}`, config);

    const workspaceConfig = readWorkspaceJson(tree);
    if (workspaceConfig && workspaceConfig.projects) {
      if (workspaceConfig.projects[e2eProjectName]) {
        if (workspaceConfig.projects[e2eProjectName].architect) {
          workspaceConfig.projects[
            e2eProjectName
          ].architect.e2e.configurations.ci = {
            protractorConfig: `apps/${directory}${e2eProjectName}/${confFile}`,
          };
        }
      }
    }
    return updateWorkspace({ projects: workspaceConfig.projects })(
      tree,
      <any>context
    );
  };
}

/**
 * Add headless options to e2e tests
 * @param options
 */
function addHeadlessE2e(options: Schema): Rule {
  const framework: 'protractor' | 'cypress' | 'none' = options.e2eTestRunner;
  switch (framework) {
    case 'protractor':
      return <any>addProtractorCiConfig(options);

    default:
      return noop();
  }
}

function addAppFiles(options: Schema, extra: string = ''): Rule {
  extra = extra ? `${extra}_` : '';
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          xplatFolderName: XplatHelpers.getXplatFoldername('web', 'angular'),
        }),
        move(`apps/${directory}${options.name}`),
      ])
    )
  );
}

function adjustAppFiles(options: Schema, tree: Tree): Rule {
  const directory = options.directory ? `${options.directory}/` : '';
  tree.overwrite(
    `/apps/${directory}${options.name}/src/index.html`,
    indexContent(options.name)
  );
  tree.overwrite(
    `/apps/${directory}${options.name}/src/main.ts`,
    mainContent()
  );
  tree.overwrite(
    `/apps/${directory}${options.name}/src/styles.scss`,
    `@import 'scss/index';`
  );
  tree.overwrite(
    `/apps/${directory}${options.name}/src/app/app.component.html`,
    options.routing
      ? `<router-outlet></router-outlet>`
      : appCmpHtml(options.name)
  );
  if (options.routing) {
    // update home route to reflect with root cmp would have been
    tree.overwrite(
      `/apps/${directory}${options.name}/src/app/features/home/components/home.component.html`,
      appCmpHtml(options.name)
    );
  }
  tree.overwrite(
    `/apps/${directory}${options.name}/src/app/app.component.ts`,
    appCmpContent()
  );
  tree.overwrite(
    `/apps/${directory}${options.name}/src/app/app.component.spec.ts`,
    appCmpSpec()
  );
  tree.overwrite(
    `/apps/${directory}${options.name}/src/app/app.module.ts`,
    appModuleContent(options)
  );
  // update cli config for shared web specific scss
  const workspaceConfig = readWorkspaceJson(tree);
  // find app
  if (workspaceConfig && workspaceConfig.projects) {
    if (workspaceConfig.projects[options.name]) {
      if (workspaceConfig.projects[options.name].architect) {
        workspaceConfig.projects[
          options.name
        ].architect.build.options.styles = [
          `libs/xplat/${XplatHelpers.getXplatFoldername(
            'web',
            'angular'
          )}/scss/src/_index.scss`,
          `apps/${directory}${options.name}/src/styles.scss`,
        ];
      }
    }
  }
  return <any>updateWorkspace({ projects: workspaceConfig.projects });
}

function indexContent(name: string) {
  return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>${getNpmScope()} ${name}</title>
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

function appCmpHtml(name: string) {
  return `<div class="p-x-20">
  <${getPrefix()}-header title="${name}"></${getPrefix()}-header>

  <h2>Nx</h2>

  An open source toolkit for enterprise Angular applications. Nx is designed to help you create and build enterprise grade
  Angular applications. It provides an opinionated approach to application project structure and patterns.

  <h3>Quick Start & Documentation</h3>

  <a href="https://nrwl.io/nx">Watch a 5-minute video on how to get started with Nx.</a>

  <h1>{{'welcome' | translate}}!</h1>
  <h3>Try things out</h3>

  <a href="https://nstudio.io/xplat">Learn more about xplat.</a>
</div>`;
}

function appCmpContent() {
  return `import { Component } from '@angular/core';

// xplat
import { AppBaseComponent } from '@${getNpmScope()}/${XplatHelpers.getXplatFoldername(
    'web',
    'angular'
  )}';

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

/**
 * @todo Pass this initial tests
 */
function appCmpSpec() {
  return `
describe('Web App component generic test', () => {
  it('Should be true', () => {
    expect(true).toBeTruthy();
  });
});

/*import { TestBed, async } from '@angular/core/testing';
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
*/   
`;
}

function appModuleContent(options) {
  return `import { NgModule } from '@angular/core';

// libs
import { environment } from '@${getNpmScope()}/core';

// app
import { CoreModule } from './core/core.module';
import { SharedModule } from './features/shared/shared.module';
${options.routing ? `import { AppRoutingModule } from './app.routing';` : ''}
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        CoreModule,
        SharedModule${
          options.routing
            ? `,
        AppRoutingModule`
            : ''
        }
    ],
    declarations: [AppComponent],
    bootstrap: [AppComponent]
})
export class AppModule {}
`;
}
