import { Tree } from '@angular-devkit/schematics';
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
    platforms: 'nativescript'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat support for nativescript-angular only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    // const files = tree.files;
    expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
    expect(tree.exists('/xplat/nativescript-angular/index.ts')).toBeTruthy();
    expect(
      tree.exists('/xplat/nativescript-angular/core/index.ts')
    ).toBeTruthy();
    expect(
      tree.exists('/xplat/nativescript-angular/features/ui/index.ts')
    ).toBeTruthy();
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    // console.log('packageFile:', packageFile);
    expect(packageFile.dependencies[`tns-core-modules`]).not.toBeUndefined();
    expect(
      packageFile.dependencies[`nativescript-angular`]
    ).not.toBeUndefined();
    expect(
      packageFile.dependencies[`nativescript-ngx-fonticon`]
    ).not.toBeUndefined();
    expect(
      packageFile.devDependencies[`tns-platform-declarations`]
    ).not.toBeUndefined();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/nativescript-angular']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/nativescript-angular/*']).toBeTruthy();
  });

  it('should create default xplat support without framework suffix when specifying default', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.framework = 'angular';
    options.setDefault = true;

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/nativescript']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/nativescript/*']).toBeTruthy();
  });
});
