import { Tree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import * as path from 'path';

import {
  supportedPlatforms,
  setTest,
  jsonParse,
  XplatHelpers
} from '@nstudio/xplat';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatHelpers.Schema = {
    npmScope: 'testing',
    prefix: 'ft', // foo test
    platforms: 'electron'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat support for electron which should always include web as well', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    const files = tree.files;
    expect(files.indexOf('/xplat/web-angular/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/xplat/electron-angular/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript-angular/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    // const hasScss = packageFile.dependencies[`@testing/scss`];
    // expect(hasScss).not.toBeUndefined();
    const hasWebScss = packageFile.dependencies[`@testing/web`];
    expect(hasWebScss).not.toBeUndefined();
    // should not include these root packages
    const hasNativeScript = packageFile.dependencies[`nativescript-angular`];
    expect(hasNativeScript).toBeUndefined();
    const hasElectron = packageFile.devDependencies[`electron`];
    expect(hasElectron).toBeDefined();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/electron-angular']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/electron-angular/*']).toBeTruthy();
  });

  it('should create default xplat support without framework suffix when specifying default', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.framework = 'angular';
    options.setDefault = true;

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/electron/index.ts')).toBeTruthy();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/electron']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/electron/*']).toBeTruthy();
  });
});
