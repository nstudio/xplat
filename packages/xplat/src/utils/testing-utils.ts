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
    '/tsconfig.json',
    JSON.stringify({ compilerOptions: { paths: {} } })
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
          architect: {
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
  tree.create('/libs/core/index.ts', '');
  tree.create(
    '/libs/core/core.module.ts',
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
    '/libs/core/services/index.ts',
    `export * from './log.service';
  export * from './window.service';
  export * from './tokens';
  `
  );
  tree.create('/libs/features/index.ts', '');
  tree.create(
    '/libs/features/ui/ui.module.ts',
    `import { NgModule } from '@angular/core';
  import { TranslateModule } from '@ngx-translate/core';
  import { DatePipe } from './pipes';
  
  @NgModule({
    imports: [TranslateModule],
    declarations: [DatePipe],
    exports: [TranslateModule]
  })
  export class UISharedModule {}
  `
  );
  tree.create('/libs/utils/index.ts', '');
}

export function createXplatNativeScriptAngular(
  tree: Tree,
  framework?: FrameworkTypes
) {
  const frameworkSuffix = framework === 'angular' ? '' : '-angular';
  tree.create(`/xplat/nativescript${frameworkSuffix}/index.ts`, '');
  tree.create(`/xplat/nativescript${frameworkSuffix}/package.json`, '');
  tree.create(`/xplat/nativescript${frameworkSuffix}/core/index.ts`, '');
  tree.create(
    `/xplat/nativescript${frameworkSuffix}/core/core.module.ts`,
    `import { NgModule, Optional, SkipSelf } from '@angular/core';

    // nativescript
    import { NativeScriptModule, NativeScriptHttpClientModule } from '@nativescript/angular';
    import { Device } from '@nativescript/core';
    import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
    
    // libs
    import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
    import { CoreModule, PlatformLanguageToken, PlatformWindowToken } from '@<%= npmScope %>/core';
    import { throwIfAlreadyLoaded } from '@<%= npmScope %>/utils';
    
    // app
    import { TNSWindowService } from './services/tns-window.service';
    import { TNSTranslateLoader } from './services/tns-translate.loader';
    
    // factories
    export function platformLangFactory() {
      return Device.language;
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
    `/xplat/nativescript${frameworkSuffix}/core/services/index.ts`,
    `export * from './app.service';`
  );
  tree.create(`/xplat/nativescript${frameworkSuffix}/features/ui/index.ts`, '');
  tree.create(
    `/xplat/nativescript${frameworkSuffix}/features/ui/ui.module.ts`,
    `import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';

  import { NativeScriptCommonModule, NativeScriptFormsModule, NativeScriptRouterModule } from '@nativescript/angular';
  
  import { TNSFontIconModule } from 'nativescript-ngx-fonticon';
  import { UISharedModule } from '@<%= npmScope %>/features';
  import { HeaderComponent } from './components';
  
  @NgModule({
    imports: [
      NativeScriptCommonModule,
      NativeScriptFormsModule,
      NativeScriptRouterModule,
      TNSFontIconModule,
      UISharedModule
    ],
    declarations: [
      HeaderComponent
    ],
    exports: [
      NativeScriptCommonModule,
      NativeScriptFormsModule,
      NativeScriptRouterModule,
      TNSFontIconModule,
      UISharedModule,
      HeaderComponent
    ],
    schemas: [NO_ERRORS_SCHEMA]
  })
  export class UIModule {}    
  `
  );
  tree.create(`/xplat/nativescript${frameworkSuffix}/features/index.ts`, '');
  tree.create(`/xplat/nativescript${frameworkSuffix}/scss/_variables.scss`, '');
  tree.create(`/xplat/nativescript${frameworkSuffix}/utils/index.ts`, ``);
}

export function createXplatWebAngular(tree: Tree, framework?: FrameworkTypes) {
  const frameworkSuffix = framework === 'angular' ? '' : '-angular';
  tree.create(`/xplat/web${frameworkSuffix}/index.ts`, '');
  tree.create(`/xplat/web${frameworkSuffix}/package.json`, '');
  tree.create(`/xplat/web${frameworkSuffix}/core/index.ts`, '');
  tree.create(`/xplat/web${frameworkSuffix}/features/ui/index.ts`, '');
  tree.create(
    `/xplat/web${frameworkSuffix}/features/ui/ui.module.ts`,
    `import { NgModule } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule, ReactiveFormsModule } from '@angular/forms';
  import { RouterModule } from '@angular/router';
  
  // libs
  import { UISharedModule } from '@<%= npmScope %>/features';
  import { HeaderComponent } from './components';
  
  @NgModule({
    imports: [
      CommonModule,
      RouterModule,
      FormsModule,
      ReactiveFormsModule,
      UISharedModule
    ],
    declarations: [HeaderComponent],
    exports: [
      CommonModule,
      RouterModule,
      FormsModule,
      ReactiveFormsModule,
      UISharedModule,
      HeaderComponent
    ]
  })
  export class UIModule {}
  `
  );
  tree.create(`/xplat/web${frameworkSuffix}/features/index.ts`, '');
  tree.create(`/xplat/web${frameworkSuffix}/scss/_variables.scss`, '');
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
