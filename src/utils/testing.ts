import { SchematicContext, Tree, externalSchematic, SchematicsException } from '@angular-devkit/schematics';

export function createEmptyWorkspace(tree: Tree): Tree {
    tree.create('/angular.json', JSON.stringify({
        $schema: "./node_modules/@angular/cli/lib/config/schema.json",
        projects: {},
        newProjectRoot: '',
        cli: {
            defaultCollection: "@nrwl/schematics"
        }
    }));
    tree.create('/nx.json', JSON.stringify({
        npmScope: "testing",
        projects: {}
    }));
    tree.create('/.gitignore', '');
    tree.create('/package.json', JSON.stringify({ 
      name: 'testing',
      dependencies: {}, 
      devDependencies: {}, 
      xplat: {
        prefix: 'tt'
      }
    }));
    tree.create('/tsconfig.json', JSON.stringify({compilerOptions: { paths: {}}}));
    tree.create('/tslint.json', JSON.stringify({
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
    }));
    return tree;
}

export function createXplatWithAppsForElectron(tree: Tree): Tree {
  tree = createXplatWithApps(tree);
  tree.overwrite('angular.json', JSON.stringify({
    $schema: "./node_modules/@angular/cli/lib/config/schema.json",
    projects: {
      'web-viewer': {
        architect: {
          build: {
            options: {
              assets: []
            }
          },
          serve: {
            options: {
              
            },
            configurations: {
              production: {

              }
            }
          }
        }
      }
    }
  }));
  tree.overwrite('/nx.json', JSON.stringify({
    npmScope: "testing",
    projects: {
      'web-viewer': {
        tags: []
      }
    }
  }));
  tree.create('/tools/tsconfig.tools.json', JSON.stringify({
    "extends": "../tsconfig.json"
  }));
  return tree;
}

export function createXplatWithApps(tree: Tree): Tree {
  tree = createEmptyWorkspace(tree);
  createStandardWebFiles(tree);
  return tree;
}

export function createStandardWebFiles(tree: Tree) {
  tree.create('/apps/web-viewer/src/index.html', '');
  tree.create('/apps/web-viewer/src/app/features/core/core.module.ts', '');
  tree.create('/apps/web-viewer/src/app/app.module.ts', '');
  tree.create('/apps/web-viewer/src/app/app.routing.ts', `import { NgModule } from '@angular/core';
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
    imports: [
      SharedModule,
      RouterModule.forRoot(routes)
    ]
  })
  export class AppRoutingModule {}`);
}

export const isInModuleMetadata = (
    moduleName: string,
    property: string,
    value: string,
    inArray: boolean,
) =>
    isInDecoratorMetadata(moduleName, property, value, 'NgModule', inArray);

export const isInComponentMetadata = (
    componentName: string,
    property: string,
    value: string,
    inArray: boolean,
) =>
    isInDecoratorMetadata(componentName, property, value, 'Component', inArray);

export const isInDecoratorMetadata = (
    moduleName: string,
    property: string,
    value: string,
    decoratorName: string,
    inArray: boolean,
) =>
    new RegExp(
        `@${decoratorName}\\(\\{([^}]*)` +
        objectContaining(property, value, inArray) +
        '[^}]*\\}\\)' +
        '\\s*' +
        `(export )?class ${moduleName}`
    );

const objectContaining = (
    property: string,
    value: string,
    inArray: boolean,
) =>
    inArray ?
        keyValueInArray(property, value) :
        keyValueString(property, value);

const keyValueInArray = (
    property: string,
    value: string,
) =>
    `${property}: \\[` +
    nonLastValueInArrayMatcher +
    `${value},?` +
    nonLastValueInArrayMatcher +
    lastValueInArrayMatcher +
    `\\s*]`;

const nonLastValueInArrayMatcher = `(\\s*|(\\s*(\\w+,)*)\\s*)*`;
const lastValueInArrayMatcher = `(\\s*|(\\s*(\\w+)*)\\s*)?`;

const keyValueString = (
    property: string,
    value: string,
) => `${property}: ${value}`;
