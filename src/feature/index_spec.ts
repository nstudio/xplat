import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as FeatureOptions } from './schema';
import { createXplatWithApps, isInModuleMetadata } from '../utils';

describe('feature schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: FeatureOptions = {
    name: 'foo',
    projects: 'nativescript-viewer,web-viewer'
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createXplatWithApps(appTree);
  });

  it('should create feature module with a single starting component', () => {
    const options: FeatureOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    tree = schematicRunner.runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(files.indexOf('/apps/nativescript-viewer/package.json')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/features/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/features/foo/base/foo.base-component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/foo/foo.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/foo/foo.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `UIModule`, true));
    expect(featureModule).toMatch(`import { UIModule } from \'../ui/ui.module\'`);

    modulePath = '/xplat/web/features/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `UIModule`, true));
    expect(featureModule).toMatch(`import { UIModule } from \'../ui/ui.module\'`);
  });

  it('should create feature module WITHOUT a single starting component when using onlyModule', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    const options: FeatureOptions = { ...defaultOptions };
    options.onlyModule = true;
    tree = schematicRunner.runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(files.indexOf('/apps/nativescript-viewer/package.json')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/features/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/features/foo/base/foo.base-component.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/foo/foo.component.html')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/foo/foo.component.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')).toBe(-1);

    // file content
    let modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `UIModule`, true));
    expect(featureModule).toMatch(`import { UIModule } from \'../ui/ui.module\'`);
    expect(featureModule.indexOf('FOO_COMPONENTS')).toBe(-1);
    expect(featureModule.indexOf('declarations')).toBe(-1);

    modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `UIModule`, true));
    expect(featureModule).toMatch(`import { UIModule } from \'../ui/ui.module\'`);
  });

  it('should create feature module WITH a single starting component BUT IGNORE creating matching base component when using ignoreBase', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    const options: FeatureOptions = { 
      name: 'foo',
      platforms: 'web',
      ignoreBase: true
     };
    tree = schematicRunner.runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // shared code defaults
    expect(files.indexOf('/libs/features/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/features/foo/base/foo.base-component.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/index.ts')).toBeGreaterThanOrEqual(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/foo/foo.component.html')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/foo/foo.component.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath = '/xplat/web/features/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `UIModule`, true));
    expect(featureModule).toMatch(`import { UIModule } from \'../ui/ui.module\'`);
    expect(featureModule.indexOf('FOO_COMPONENTS')).toBeGreaterThanOrEqual(0);
    expect(featureModule.indexOf('declarations')).toBeGreaterThanOrEqual(0);

    let compPath = '/xplat/web/features/foo/components/foo/foo.component.ts';
    let compContent = getFileContent(tree, compPath);
    // console.log(compPath + ':');
    // console.log(compContent);
    expect(compContent.indexOf('extends BaseComponent')).toBeGreaterThanOrEqual(0);
    
  });

  it('should create feature module for specified projects only', () => {
    const options: FeatureOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    options.onlyProject = true;
    tree = schematicRunner.runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // feature should not be in shared code
    expect(files.indexOf('/libs/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/index.ts')).toBe(-1);

    // feature should be in projects only
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo/components/foo/foo.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo/components/foo/foo.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo/foo.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo/components/foo/foo.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo/components/foo/foo.component.ts')).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath = '/apps/nativescript-viewer/app/features/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `SharedModule`, true));
    expect(featureModule).toMatch(`import { SharedModule } from \'../shared/shared.module\'`);

    modulePath = '/apps/web-viewer/src/app/features/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `SharedModule`, true));
    expect(featureModule).toMatch(`import { SharedModule } from \'../shared/shared.module\'`);
  });

  it('Temporary: should error if routing is used without onlyProject', () => {
    const options: FeatureOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    options.routing = true;
    expect(() => tree = schematicRunner
      .runSchematic('feature', options, tree))
      .toThrowError('When generating a feature with the --routing option, please also specify --onlyProject. Support for shared code routing is under development and will be available in the future.');
  });

  it('should create feature module (with dashes in name) for specified projects WITH Routing', () => {
    const options: FeatureOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      sample: true
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt',
      routing: true
    }, tree);
    options.onlyProject = true;
    options.routing = true;
    options.name = 'foo-with-dash';
    tree = schematicRunner.runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // feature should not be in shared code
    expect(files.indexOf('/libs/features/foo-with-dash/index.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo-with-dash/index.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo-with-dash/index.ts')).toBe(-1);

    // feature should be in projects only
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo-with-dash/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo-with-dash/foo-with-dash.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo-with-dash/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo-with-dash/foo-with-dash.module.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.ts')).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath = '/apps/nativescript-viewer/app/features/foo-with-dash/foo-with-dash.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`import { NativeScriptRouterModule } from \'nativescript-angular/router\'`);
    expect(featureModule).toMatch(`component: FooWithDashComponent`);
    // expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `SharedModule`, true));
    expect(featureModule).toMatch(`NativeScriptRouterModule.forChild`);

    modulePath = '/apps/web-viewer/src/app/features/foo-with-dash/foo-with-dash.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`import { RouterModule, Routes } from \'@angular/router\'`);
    expect(featureModule).toMatch(`component: FooWithDashComponent`);
    // expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `SharedModule`, true));
    expect(featureModule).toMatch(`RouterModule.forChild`);

    // check if there was a root app.routing.ts module modified
    modulePath = '/apps/web-viewer/src/app/app.routing.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`import { RouterModule, Routes } from \'@angular/router\'`);
    expect(featureModule).toMatch(`loadChildren: './features/home/home.module#HomeModule'`);
    expect(featureModule).toMatch(`loadChildren: './features/foo-with-dash/foo-with-dash.module#FooWithDashModule'`);

    modulePath = '/apps/nativescript-viewer/app/app.routing.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`loadChildren: '~/features/home/home.module#HomeModule'`);
    expect(featureModule).toMatch(`loadChildren: '~/features/foo-with-dash/foo-with-dash.module#FooWithDashModule'`);

    // check that name with dash was handled right
    modulePath = '/apps/web-viewer/src/app/features/foo-with-dash/components/index.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`export const FOOWITHDASH_COMPONENTS`);

  });
}); 
