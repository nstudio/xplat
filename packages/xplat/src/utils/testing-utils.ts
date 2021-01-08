import {
  SchematicContext,
  Tree,
  externalSchematic,
  SchematicsException,
} from '@angular-devkit/schematics';
import { NxJson } from '@nrwl/workspace';
import { FrameworkTypes } from '@nstudio/xplat-utils';

export { getFileContent } from '@nrwl/workspace/testing';

export function createEmptyWorkspace(
  tree: Tree,
  framework?: FrameworkTypes
): Tree {
  tree.create('/.gitignore', '');
  tree.create(
    '/angular.json',
    JSON.stringify({ version: 1, projects: {}, newProjectRoot: '' })
  );
  const xplatSettings: any = {
    prefix: 'tt',
  };
  if (framework) {
    xplatSettings.framework = framework;
  }
  tree.create(
    '/package.json',
    JSON.stringify({
      dependencies: {},
      devDependencies: {},
      xplat: xplatSettings,
    })
  );
  tree.create(
    '/nx.json',
    JSON.stringify(<NxJson>{ npmScope: 'testing', projects: {} })
  );
  tree.create(
    '/tsconfig.base.json',
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
            allow: [],
          },
        ],
      },
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
          targets: {
            build: {
              options: {
                assets: [],
              },
            },
            serve: {
              options: {},
              configurations: {
                production: {},
              },
            },
          },
        },
      },
    })
  );
  tree.overwrite(
    '/nx.json',
    JSON.stringify({
      npmScope: 'testing',
      projects: {
        'web-viewer': {
          tags: [],
        },
      },
    })
  );
  tree.create(
    '/tools/tsconfig.tools.json',
    JSON.stringify({
      extends: '../tsconfig.json',
    })
  );
  return tree;
}

export function createXplatWithApps(
  tree: Tree,
  framework?: FrameworkTypes
): Tree {
  tree = createEmptyWorkspace(tree, framework);
  createXplatLibs(tree);
  createXplatWebAngular(tree, framework);
  createWebAngularApp(tree);
  return tree;
}

export function createXplatWithNativeScriptWeb(
  tree: Tree,
  withRouting?: boolean,
  framework?: FrameworkTypes
): Tree {
  tree = createEmptyWorkspace(tree, framework);
  createXplatLibs(tree);
  createXplatNativeScriptAngular(tree, framework);
  createXplatWebAngular(tree, framework);
  createNativeScriptAngularApp(tree, withRouting);
  createWebAngularApp(tree, withRouting);
  return tree;
}

export function createXplatLibs(tree: Tree) {
  tree.create('/libs/xplat/core/src/lib/index.ts', '');
  tree.create(
    '/libs/xplat/core/src/lib/core.module.ts',
    `import {
    NgModule
  } from '@angular/core';
  import { APP_BASE_HREF, CommonModule } from '@angular/common';
  
  export const BASE_PROVIDERS: any[] = [
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ];
  
  @NgModule({
    imports: [CommonModule]
  })
  export class CoreModule {}`
  );
  tree.create(
    '/libs/xplat/core/src/lib/services/index.ts',
    `export * from './log.service';
  export * from './window.service';
  export * from './tokens';
  `
  );
  tree.create('/libs/xplat/features/src/lib/index.ts', '');
  tree.create(
    '/libs/xplat/features/src/lib/ui/ui.module.ts',
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
  tree.create('/libs/xplat/utils/src/lib/index.ts', '');
}

export function createXplatNativeScriptAngular(
  tree: Tree,
  framework?: FrameworkTypes
) {
  const frameworkSuffix = framework === 'angular' ? '' : '-angular';
  // tree.create(`/libs/xplat/nativescript${frameworkSuffix}/index.ts`, '');
  // tree.create(`/libs/xplat/nativescript${frameworkSuffix}/package.json`, '');
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/core/src/lib/index.ts`,
    ''
  );
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/core/src/lib/core.module.ts`,
    `import { NgModule, Optional, SkipSelf } from '@angular/core';

    // nativescript
    import { NativeScriptModule, NativeScriptHttpClientModule } from '@nativescript/angular';
    import { Device } from '@nativescript/core';
    import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
    
    // libs
    import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
    import { CoreModule, PlatformLanguageToken, PlatformWindowToken } from '@<%= npmScope %>/xplat/core';
    import { throwIfAlreadyLoaded } from '@<%= npmScope %>/xplat/utils';
    
    // app
    import { MobileWindowService } from './services/mobile-window.service';
    import { MobileTranslateLoader } from './services/mobile-translate.loader';
    
    // factories
    export function platformLangFactory() {
      return Device.language;
    }
    
    export function createTranslateLoader() {
      return new MobileTranslateLoader('/assets/i18n/');
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
            useClass: MobileWindowService
          }
        ]),
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: createTranslateLoader
          }
        }),
      ]
    })
    export class TTCoreModule {
      constructor(
        @Optional()
        @SkipSelf()
        parentModule: TTCoreModule
      ) {
        throwIfAlreadyLoaded(parentModule, 'TTCoreModule');
      }
    }    
  `
  );
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/core/src/lib/services/index.ts`,
    `export * from './app.service';`
  );
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/features/src/lib/ui/index.ts`,
    ''
  );
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/features/src/lib/ui/ui.module.ts`,
    `import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

  import { NativeScriptCommonModule, NativeScriptFormsModule, NativeScriptRouterModule } from '@nativescript/angular';
  
  import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
  import { UISharedModule } from '@<%= npmScope %>/xplat/features';
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
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/features/src/lib/index.ts`,
    ''
  );
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/scss/src/_variables.scss`,
    ''
  );
  tree.create(
    `/libs/xplat/nativescript${frameworkSuffix}/utils/src/lib/index.ts`,
    ``
  );
}

export function createXplatWebAngular(tree: Tree, framework?: FrameworkTypes) {
  const frameworkSuffix = framework === 'angular' ? '' : '-angular';
  // tree.create(`/libs/xplat/web${frameworkSuffix}/index.ts`, '');
  // tree.create(`/libs/xplat/web${frameworkSuffix}/package.json`, '');
  tree.create(`/libs/xplat/web${frameworkSuffix}/core/src/lib/index.ts`, '');
  tree.create(
    `/libs/xplat/web${frameworkSuffix}/features/src/lib/ui/index.ts`,
    ''
  );
  tree.create(
    `/libs/xplat/web${frameworkSuffix}/features/src/lib/ui/ui.module.ts`,
    `import { NgModule } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule, ReactiveFormsModule } from '@angular/forms';
  import { RouterModule } from '@angular/router';
  
  // libs
  import { UISharedModule } from '@<%= npmScope %>/xplat/features';
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
  tree.create(
    `/libs/xplat/web${frameworkSuffix}/features/src/lib/index.ts`,
    ''
  );
  tree.create(`/libs/xplat/web${frameworkSuffix}/scss/src/_variables.scss`, '');
}

export function createWebAngularApp(tree: Tree, withRouting?: boolean) {
  tree.create('/apps/web-viewer/src/index.html', '');
  tree.create('/apps/web-viewer/src/app/features/index.ts', '');
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
        loadChildren: () => 
          import('./features/home/home.module').then(m => m.HomeModule)
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
    import { NativeScriptRouterModule } from '@nativescript/angular';
    
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
        loadChildren: () => 
          import('./features/home/home.module').then(m => m.HomeModule)
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
