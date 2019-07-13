import {
  SchematicContext,
  Tree,
  externalSchematic,
  SchematicsException
} from '@angular-devkit/schematics';
import { NxJson } from '@nrwl/workspace';

export { getFileContent } from '@nrwl/workspace/testing';

export function createEmptyWorkspace(tree: Tree): Tree {
  tree.create('/.gitignore', '');
  tree.create(
    '/angular.json',
    JSON.stringify({ version: 1, projects: {}, newProjectRoot: '' })
  );
  tree.create(
    '/package.json',
    JSON.stringify({
      dependencies: {},
      devDependencies: {},
      xplat: {
        prefix: 'tt'
      }
    })
  );
  tree.create(
    '/nx.json',
    JSON.stringify(<NxJson>{ npmScope: 'testing', projects: {} })
  );
  tree.create(
    '/tsconfig.json',
    JSON.stringify({ compilerOptions: { paths: {} } })
  );
  tree.create(
    '/tslint.json',
    JSON.stringify({
      rules: {
        'nx-enforce-module-boundaries': [
          true,
          {
            npmScope: '<%= npmScope %>',
            lazyLoad: [],
            allow: []
          }
        ]
      }
    })
  );
  return tree;
}

export function createXplatWithAppsForElectron(tree: Tree): Tree {
  tree = createXplatWithApps(tree);
  tree.overwrite(
    'angular.json',
    JSON.stringify({
      version: 1,
      projects: {
        'web-viewer': {
          architect: {
            build: {
              options: {
                assets: []
              }
            },
            serve: {
              options: {},
              configurations: {
                production: {}
              }
            }
          }
        }
      }
    })
  );
  tree.overwrite(
    '/nx.json',
    JSON.stringify({
      npmScope: 'testing',
      projects: {
        'web-viewer': {
          tags: []
        }
      }
    })
  );
  tree.create(
    '/tools/tsconfig.tools.json',
    JSON.stringify({
      extends: '../tsconfig.json'
    })
  );
  return tree;
}

export function createXplatWithApps(tree: Tree): Tree {
  tree = createEmptyWorkspace(tree);
  createXplatLibs(tree);
  createXplatWebAngular(tree);
  createWebAngularApp(tree);
  return tree;
}

export function createXplatWithNativeScriptWeb(
  tree: Tree,
  withRouting?: boolean
): Tree {
  tree = createEmptyWorkspace(tree);
  createXplatLibs(tree);
  createXplatNativeScriptAngular(tree);
  createXplatWebAngular(tree);
  createNativeScriptAngularApp(tree, withRouting);
  createWebAngularApp(tree, withRouting);
  return tree;
}

export function createXplatLibs(tree: Tree) {
  tree.create('/libs/core/index.ts', '');
  tree.create(
    '/libs/core/core.module.ts',
    `import {
    NgModule
  } from '@angular/core';
  import { APP_BASE_HREF, CommonModule } from '@angular/common';
  import { NxModule } from '@nrwl/nx';
  
  export const BASE_PROVIDERS: any[] = [
    ...CORE_PROVIDERS,
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ];
  
  @NgModule({
    imports: [CommonModule, NxModule.forRoot()]
  })
  export class CoreModule {}`
  );
  tree.create(
    '/libs/core/services/index.ts',
    `import { LogService } from './log.service';
  import { WindowService } from './window.service';
  
  export const CORE_PROVIDERS: any[] = [LogService, WindowService];
  
  export * from './log.service';
  export * from './window.service';
  export * from './tokens';
  `
  );
  tree.create('/libs/features/index.ts', '');
  tree.create(
    '/libs/features/ui/ui.module.ts',
    `import { NgModule } from '@angular/core';
  import { TranslateModule } from '@ngx-translate/core';
  import { UI_PIPES } from './pipes';
  
  const MODULES = [TranslateModule];
  
  @NgModule({
    imports: [...MODULES],
    declarations: [...UI_PIPES],
    exports: [...MODULES, ...UI_PIPES]
  })
  export class UISharedModule {}
  `
  );
  tree.create('/libs/utils/index.ts', '');
}

export function createXplatNativeScriptAngular(tree: Tree) {
  tree.create('/xplat/nativescript/index.ts', '');
  tree.create('/xplat/nativescript/package.json', '');
  tree.create('/xplat/nativescript/core/index.ts', '');
  tree.create(
    '/xplat/nativescript/core/core.module.ts',
    `import { NgModule } from '@angular/core';

  // nativescript
  import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
  import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';
  import { device } from 'tns-core-modules/platform';
  import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
  
  // libs
  import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
  import { CoreModule, PlatformLanguageToken, PlatformWindowToken } from '@testing/core';
  import { throwIfAlreadyLoaded } from '@testing/utils';
  
  // app
  import { CORE_PROVIDERS } from './services';
  import { TNSWindowService } from './services/tns-window.service';
  import { TNSTranslateLoader } from './services/tns-translate.loader';
  
  // factories
  export function platformLangFactory() {
    return device.language;
  }
  
  export function createTranslateLoader() {
    return new TNSTranslateLoader('/assets/i18n/');
  }
  
  @NgModule({
    imports: [
      NativeScriptModule,
      NativeScriptHttpClientModule,
      TNSFontIconModule.forRoot({
        fa: './assets/fontawesome.min.css'
      }),
      CoreModule.forRoot([
        {
          provide: PlatformLanguageToken,
          useFactory: platformLangFactory
        },
        {
          provide: PlatformWindowToken,
          useClass: TNSWindowService
        }
      ]),
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader
        }
      }),
    ],
    providers: [
      ...CORE_PROVIDERS
    ]
  })
  export class TTCoreModule {

  }
  `
  );
  tree.create(
    '/xplat/nativescript/core/services/index.ts',
    `import { AppService } from './app.service';
  import { TNSWindowService } from './tns-window.service';
  
  export const CORE_PROVIDERS: any[] = [AppService, TNSWindowService];
  
  export * from './app.service';
  `
  );
  tree.create('/xplat/nativescript/features/ui/index.ts', '');
  tree.create(
    '/xplat/nativescript/features/ui/ui.module.ts',
    `import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

  import { NativeScriptFormsModule } from 'nativescript-angular/forms';
  import { NativeScriptCommonModule } from 'nativescript-angular/common';
  import { NativeScriptRouterModule } from 'nativescript-angular/router';
  
  import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
  import { UISharedModule } from '@testing/features';
  import { UI_COMPONENTS } from './components';
  
  const MODULES = [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    NativeScriptRouterModule,
    TNSFontIconModule,
    UISharedModule
  ];
  
  @NgModule({
    imports: [...MODULES],
    declarations: [...UI_COMPONENTS],
    exports: [...MODULES, ...UI_COMPONENTS],
    schemas: [NO_ERRORS_SCHEMA]
  })
  export class UIModule {}
  `
  );
  tree.create('/xplat/nativescript/features/index.ts', '');
  tree.create('/xplat/nativescript/scss/_variables.scss', '');
  tree.create('/xplat/nativescript/utils/index.ts', ``);
}

export function createXplatWebAngular(tree: Tree) {
  tree.create('/xplat/web/index.ts', '');
  tree.create('/xplat/web/package.json', '');
  tree.create('/xplat/web/core/index.ts', '');
  tree.create('/xplat/web/features/ui/index.ts', '');
  tree.create(
    '/xplat/web/features/ui/ui.module.ts',
    `import { NgModule } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule, ReactiveFormsModule } from '@angular/forms';
  import { RouterModule } from '@angular/router';
  
  // libs
  import { UISharedModule } from '@testing/features';
  import { UI_COMPONENTS } from './components';
  
  const MODULES = [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    UISharedModule
  ];
  
  @NgModule({
    imports: [...MODULES],
    declarations: [...UI_COMPONENTS],
    exports: [...MODULES, ...UI_COMPONENTS]
  })
  export class UIModule {}
  `
  );
  tree.create('/xplat/web/features/index.ts', '');
  tree.create('/xplat/web/scss/_variables.scss', '');
}

export function createWebAngularApp(tree: Tree, withRouting?: boolean) {
  tree.create('/apps/web-viewer/src/index.html', '');
  tree.create('/apps/web-viewer/src/app/features/core/core.module.ts', '');
  tree.create('/apps/web-viewer/src/app/app.module.ts', '');
  if (withRouting) {
    tree.create(
      `/apps/web-viewer/src/app/features/home/components/home.component.html`,
      ''
    );
    tree.create(
      '/apps/web-viewer/src/app/app.routing.ts',
      `// angular
    import { NgModule } from '@angular/core';
    import { RouterModule, Routes } from '@angular/router';
    
    // app
    import { SharedModule } from './features/shared/shared.module';
    
    const routes: Routes = [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: './features/home/home.module#HomeModule'
      }
    ];
    
    @NgModule({
      imports: [SharedModule, RouterModule.forRoot(routes)]
    })
    export class AppRoutingModule {}
    `
    );
  }
}

export function createNativeScriptAngularApp(
  tree: Tree,
  withRouting?: boolean
) {
  tree.create('/apps/nativescript-viewer/package.json', '');
  tree.create('/apps/nativescript-viewer/tsconfig.json', '');
  tree.create('/apps/nativescript-viewer/webpack.config.js', '');
  tree.create('/apps/nativescript-viewer/src/core/core.module.ts', '');
  tree.create(
    '/apps/nativescript-viewer/src/features/shared/shared.module.ts',
    ''
  );
  tree.create('/apps/nativescript-viewer/src/scss/_index.scss', '');
  tree.create('/apps/nativescript-viewer/src/app.module.ts', '');
  tree.create('/apps/nativescript-viewer/src/main.ts', '');
  if (withRouting) {
    tree.create(
      `/apps/nativescript-viewer/src/features/home/components/home.component.html`,
      ''
    );
    tree.create(
      '/apps/nativescript-viewer/src/app.routing.ts',
      `// angular
    import { NgModule } from '@angular/core';
    import { Routes } from '@angular/router';
    
    // nativescript
    import { NativeScriptRouterModule } from 'nativescript-angular/router';
    
    // app
    import { SharedModule } from './features/shared/shared.module';
    
    const routes: Routes = [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadChildren: '~/features/home/home.module#HomeModule'
      }
    ];
    
    @NgModule({
      imports: [SharedModule, NativeScriptRouterModule.forRoot(routes)]
    })
    export class AppRoutingModule {}
    `
    );
  }
}

export const isInModuleMetadata = (
  moduleName: string,
  property: string,
  value: string,
  inArray: boolean
) => isInDecoratorMetadata(moduleName, property, value, 'NgModule', inArray);

export const isInComponentMetadata = (
  componentName: string,
  property: string,
  value: string,
  inArray: boolean
) =>
  isInDecoratorMetadata(componentName, property, value, 'Component', inArray);

export const isInDecoratorMetadata = (
  moduleName: string,
  property: string,
  value: string,
  decoratorName: string,
  inArray: boolean
) =>
  new RegExp(
    `@${decoratorName}\\(\\{([^}]*)` +
      objectContaining(property, value, inArray) +
      '[^}]*\\}\\)' +
      '\\s*' +
      `(export )?class ${moduleName}`
  );

const objectContaining = (property: string, value: string, inArray: boolean) =>
  inArray ? keyValueInArray(property, value) : keyValueString(property, value);

const keyValueInArray = (property: string, value: string) =>
  `${property}: \\[` +
  nonLastValueInArrayMatcher +
  `${value},?` +
  nonLastValueInArrayMatcher +
  lastValueInArrayMatcher +
  `\\s*]`;

const nonLastValueInArrayMatcher = `(\\s*|(\\s*(\\w+,)*)\\s*)*`;
const lastValueInArrayMatcher = `(\\s*|(\\s*(\\w+)*)\\s*)?`;

const keyValueString = (property: string, value: string) =>
  `${property}: ${value}`;
