import { Tree } from '@angular-devkit/schematics';
import {
  supportedPlatforms,
  setTest,
  jsonParse,
  getRootTsConfigPath,
} from '@nstudio/xplat-utils';
import { XplatHelpers } from '@nstudio/xplat';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatHelpers.Schema = {
    npmScope: 'testing',
    prefix: 'ft', // foo test
    platforms: 'nativescript',
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree, 'angular');
  });

  it('should create default xplat support for nativescript-angular only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    // const files = tree.files;
    expect(tree.exists('/libs/core/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/nativescript/core/index.ts')).toBeTruthy();
    expect(
      tree.exists('/xplat/nativescript/features/ui/index.ts')
    ).toBeTruthy();
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    // console.log('packageFile:', packageFile);
    expect(packageFile.dependencies[`tns-core-modules`]).toBeUndefined();
    expect(packageFile.dependencies[`@nativescript/core`]).toBeDefined();
    expect(packageFile.dependencies[`nativescript-angular`]).toBeUndefined();
    expect(packageFile.dependencies[`@nativescript/angular`]).toBeDefined();
    expect(
      packageFile.dependencies[`nativescript-ngx-fonticon`]
    ).not.toBeUndefined();
    expect(
      packageFile.devDependencies[`@nativescript/types`]
    ).not.toBeUndefined();
    let filePath = getRootTsConfigPath();
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(
      fileContent.compilerOptions.paths['@testing/nativescript']
    ).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/nativescript/*']
    ).toBeTruthy();
    filePath = '/xplat/nativescript/.xplatframework';
    fileContent = getFileContent(tree, filePath);
    // console.log(fileContent);
    expect(fileContent.indexOf('angular')).toBeGreaterThanOrEqual(0);
  });

  it('should create default xplat support with framework suffix when not specifying default', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    // console.log(tree.files);
    expect(tree.exists('/libs/core/index.ts')).toBeTruthy();
    expect(tree.exists('/libs/scss/_index.scss')).toBeTruthy();
    expect(tree.exists('/xplat/nativescript-angular/index.ts')).toBeTruthy();
    const filePath = getRootTsConfigPath();
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(
      fileContent.compilerOptions.paths['@testing/nativescript-angular']
    ).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/nativescript-angular/*']
    ).toBeTruthy();
  });

  it('when default framework is set, can still create base platform support', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    let options: XplatHelpers.Schema = { ...defaultOptions };
    options.framework = 'angular';

    let tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    let filePath = getRootTsConfigPath();
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(
      fileContent.compilerOptions.paths['@testing/nativescript']
    ).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/nativescript/*']
    ).toBeTruthy();

    await expect(runSchematic('xplat', defaultOptions, tree)).rejects.toThrow(
      `You currently have "angular" set as your default frontend framework and have already generated xplat support for "nativescript". A command is coming soon to auto reconfigure your workspace to later add baseline platform support for those which have previously been generated prepaired with a frontend framework.`
    );
  });
});
