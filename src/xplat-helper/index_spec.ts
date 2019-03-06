import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as AppWebOptions } from '../app.web/schema';
import { Schema as AppNativeScriptOptions } from '../app.nativescript/schema';
import { Schema as XPlatOptions } from '../xplat/schema';
import { Schema as HelperOptions } from './schema';
import { stringUtils, isInModuleMetadata, createEmptyWorkspace, setTest } from '../utils';
setTest();

describe('xplat-helper schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json'),
  );

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  it('imports: should create all files', () => {
    const optionsXplat: XPlatOptions = { 
      npmScope: 'testing',
      prefix: 'tt',
      platforms: 'web,nativescript'
    };

    appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const appOptions: AppNativeScriptOptions = {
      name: 'foo',
      npmScope: 'testing',
      sample: true,
      prefix: 'tt', // foo test
    };
    // console.log('appTree:', appTree);
    appTree = schematicRunner.runSchematic('app.nativescript', appOptions, appTree);

    const options: HelperOptions = { 
      name: 'imports',
      platforms: 'nativescript'
     };
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

  it('applitools: should create all files', async () => {
    const optionsXplat: XPlatOptions = { 
      npmScope: 'testing',
      prefix: 'tt',
      platforms: 'web,nativescript'
    };

    appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const appOptions: AppWebOptions = {
      name: 'foo',
      prefix: 'tt',
      e2eTestRunner: 'cypress'
    };
    // console.log('appTree:', appTree);
    appTree = await schematicRunner.runSchematicAsync('app', appOptions, appTree).toPromise();
    
    const cypressJsonPath = '/apps/web-foo-e2e/cypress.json';
    let fileContent = getFileContent(appTree, cypressJsonPath);
    let cypressJson = JSON.parse(fileContent);
    expect(cypressJson.supportFile).toBe(false);

    const options: HelperOptions = { 
      name: 'applitools',
      platforms: 'web',
      target: 'web-foo'
     };
    // console.log('appTree:', appTree);
    const tree = schematicRunner.runSchematic('xplat-helper', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(files.indexOf('/apps/web-foo-e2e/src/support/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/web-foo-e2e/src/plugins/index.ts')).toBeGreaterThanOrEqual(0);
    // modified testing files
    let filePath = '/apps/web-foo-e2e/src/support/index.ts';
    fileContent = getFileContent(tree, filePath)
    // console.log(fileContent);

    expect(fileContent.indexOf('@applitools/eyes-cypress/commands')).toBeGreaterThanOrEqual(0);

    filePath = '/apps/web-foo-e2e/src/plugins/index.ts';
    fileContent = getFileContent(tree, filePath)
    // console.log(fileContent);

    expect(fileContent.indexOf(`require('@applitools/eyes-cypress')(module);`)).toBeGreaterThanOrEqual(0);

    fileContent = getFileContent(tree, cypressJsonPath);
    // console.log(fileContent);
    cypressJson = JSON.parse(fileContent);
    expect(cypressJson.supportFile).toBe(`../../dist/out-tsc/apps/web-foo-e2e/src/support/index.js`);

    filePath = '/apps/web-foo-e2e/src/integration/app.spec.ts';
    fileContent = getFileContent(tree, filePath)
    // console.log(fileContent);

    expect(fileContent.indexOf(`eyesOpen`)).toBeGreaterThanOrEqual(0);
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
