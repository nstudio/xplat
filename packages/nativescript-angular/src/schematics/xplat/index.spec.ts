import { Tree } from '@angular-devkit/schematics';
import {
  supportedPlatforms,
  setTest,
  jsonParse,
  XplatHelpers
} from '@nstudio/xplat';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';
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
    appTree = createEmptyWorkspace(appTree, 'angular');
  });

  it('should create default xplat support for nativescript-angular only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    // const files = tree.files;
    expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    expect(
      tree.exists('/xplat/nativescript/core/index.ts')
    ).toBeTruthy();
    expect(
      tree.exists('/xplat/nativescript/features/ui/index.ts')
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
    expect(fileContent.compilerOptions.paths['@testing/nativescript']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/nativescript/*']).toBeTruthy();
  });

  it('should create default xplat support with framework suffix when not specifying default', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/nativescript-angular/index.ts')).toBeTruthy();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/nativescript-angular']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/nativescript-angular/*']).toBeTruthy();
  });

  it('when default framework is set, can still create base platform support', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    let options: XplatHelpers.Schema = { ...defaultOptions };
    options.framework = 'angular';
    options.setDefault = true;

    let tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    let filePath = '/tsconfig.json';
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/nativescript']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/nativescript/*']).toBeTruthy();

    expect(
      () => (runSchematicSync('xplat', defaultOptions, tree))
    ).toThrow(
      `You currently have "angular" set as your default frontend framework and have already generated xplat support for "nativescript". A command is coming soon to auto reconfigure your workspace to later add baseline platform support for those which have previously been generated prepaired with a frontend framework.`
    );
  });
});
