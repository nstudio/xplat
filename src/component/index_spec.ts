import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as GenerateOptions } from './schema';
import { createXplatWithApps } from '../utils';

describe('component schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: GenerateOptions = {
    name: 'signup',
    feature: 'foo',
    platforms: 'nativescript,web'
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createXplatWithApps(appTree);
  });

  it('should create component for specified platforms', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      platforms: 'nativescript,web'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    tree = schematicRunner.runSchematic('feature', {
      name: 'foo',
      platforms: 'nativescript,web'
    }, tree);
    const options: GenerateOptions = { ...defaultOptions };
    tree = schematicRunner.runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(files.indexOf('/libs/features/foo/base/signup.base-component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/signup/signup.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/signup/signup.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/signup/signup.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/signup/signup.component.ts')).toBeGreaterThanOrEqual(0);

    // ensure base index was modified
    let barrelPath = '/libs/features/foo/base/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`./signup.base-component`)).toBeGreaterThanOrEqual(0);


    // file content
    barrelPath = '/xplat/nativescript/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(0);
    expect(barrelIndex.indexOf(`./signup/signup.component`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/xplat/web/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(0);
  });

  it('should create component for specified platforms with subFolder option', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      platforms: 'nativescript,web'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    tree = schematicRunner.runSchematic('feature', {
      name: 'foo',
      platforms: 'nativescript,web'
    }, tree);
    const options: GenerateOptions = { ...defaultOptions };
    options.subFolder = 'registration';
    tree = schematicRunner.runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(files.indexOf('/libs/features/foo/base/registration/signup.base-component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/registration/signup/signup.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/registration/signup/signup.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/registration/signup/signup.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/foo/components/registration/signup/signup.component.ts')).toBeGreaterThanOrEqual(0);

    // ensure base index was modified
    let barrelPath = '/libs/features/foo/base/registration/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`./signup.base-component`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/libs/features/foo/base/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`./registration`)).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath = '/xplat/nativescript/features/foo/components/registration/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(0);
    expect(barrelIndex.indexOf(`./signup/signup.component`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/xplat/web/features/foo/components/registration/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath = '/xplat/nativescript/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`REGISTRATION_COMPONENTS`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/xplat/web/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`REGISTRATION_COMPONENTS`)).toBeGreaterThanOrEqual(0);
  });

  it('should create component for specified projects only', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      platforms: 'nativescript,web'
    }, appTree);
    tree = schematicRunner.runSchematic('app.nativescript', {
      name: 'viewer',
      prefix: 'tt'
    }, tree);
    tree = schematicRunner.runSchematic('feature', {
      name: 'foo',
      projects: 'nativescript-viewer,web-viewer',
      onlyProject: true
    }, tree);
    const options: GenerateOptions = { 
      name: 'signup',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer'
    };
    tree = schematicRunner.runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // component should not be setup to share
    expect(files.indexOf('/libs/features/foo/base/signup.base-component.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/signup/signup.component.html')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/components/signup/signup.component.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/components/signup/signup.component.html')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/components/signup/signup.component.ts')).toBe(-1);

    // component should be project specific
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo/components/signup/signup.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-viewer/app/features/foo/components/signup/signup.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo/components/signup/signup.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-viewer/src/app/features/foo/components/signup/signup.component.ts')).toBeGreaterThanOrEqual(0);

    // file content
    let barrelPath = '/apps/nativescript-viewer/app/features/foo/components/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(0);
    expect(barrelIndex.indexOf(`./signup/signup.component`)).toBeGreaterThanOrEqual(0);

    // let modulePath = '/apps/nativescript-viewer/app/features/foo/foo.module.ts';
    // let content = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(content);
    // // component symbol should be at end of components collection
    // expect(content.indexOf(`./signup/signup.component.ts`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/apps/web-viewer/src/app/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(0);
  });

  it('should THROW if feature module does not exist in projects', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      platforms: 'nativescript,web'
    }, appTree);
    const options: GenerateOptions = { 
      name: 'signup',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer'
    };

    expect(() => tree = schematicRunner
      .runSchematic('component', options, tree))
      .toThrowError(`apps/nativescript-viewer/app/features/foo/foo.module.ts does not exist. Create the feature module first. For example: ng g feature foo --projects=nativescript-viewer --onlyModule`);
  });
}); 
