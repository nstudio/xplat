import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as AppOptions } from '../app.nativescript/schema';
import { Schema as XPlatOptions } from '../xplat/schema';
import { Schema as HelperOptions } from './schema';
import { stringUtils, isInModuleMetadata, createEmptyWorkspace } from '../utils';

describe('xplat-helper schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: HelperOptions = {
    name: 'imports',
    platforms: 'nativescript'
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create all files for the helper', () => {
    const optionsXplat: XPlatOptions = { 
      npmScope: 'testing',
      prefix: 'tt',
      platforms: 'web,nativescript'
    };

    appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const appOptions: AppOptions = {
      name: 'foo',
      npmScope: 'testing',
      sample: true,
      prefix: 'tt', // foo test
    };
    // console.log('appTree:', appTree);
    appTree = schematicRunner.runSchematic('app.nativescript', appOptions, appTree);

    const options: HelperOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    const tree = schematicRunner.runSchematic('xplat-helper', options, appTree);
    const files = tree.files;
    // console.log(files);

    // xplat helpers
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/core.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/ui.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/angular/core.ts')).toBeGreaterThanOrEqual(0);

    // should update tsconfig files
    let filePath = '/tsconfig.json';
    let fileContent = JSON.parse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@nativescript/*'][0]).toBe('xplat/nativescript/utils/@nativescript/*');

    filePath = '/apps/nativescript-foo/tsconfig.json';
    fileContent = JSON.parse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@nativescript/*'][0]).toBe('../../xplat/nativescript/utils/@nativescript/*');
  });

  it('generating helper for a platform where the helper is not supported should not do anything', () => {
    const optionsXplat: XPlatOptions = { 
      npmScope: 'testing',
      prefix: 'tt',
      platforms: 'web,nativescript'
    };

    appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const options: HelperOptions = { 
      name: 'imports',
      platforms: 'web'  
    };
    // console.log('appTree:', appTree);
    const tree = schematicRunner.runSchematic('xplat-helper', options, appTree);
    const files = tree.files;
    // console.log(files);

    // xplat helpers
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/core.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/ui.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/angular/core.ts')).toBe(-1);
  });
}); 
