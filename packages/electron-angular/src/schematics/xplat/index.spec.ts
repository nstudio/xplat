import { Tree } from '@angular-devkit/schematics';

import { setTest, jsonParse } from '@nstudio/xplat-utils';
import { XplatHelpers } from '@nstudio/xplat';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatHelpers.Schema = {
    npmScope: 'testing',
    prefix: 'ft', // foo test
    platforms: 'electron',
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree, 'angular');
  });

  it('should create default xplat support for electron which should always include web as well', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    const files = tree.files;
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/electron/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    // const hasScss = packageFile.dependencies[`@testing/scss`];
    // expect(hasScss).not.toBeUndefined();
    // const hasWebScss = packageFile.dependencies[`@testing/web-scss`];
    // expect(hasWebScss).not.toBeUndefined();
    // should not include these root packages
    const hasNativeScript = packageFile.dependencies[`nativescript-angular`];
    expect(hasNativeScript).toBeUndefined();
    const hasElectron = packageFile.devDependencies[`electron`];
    expect(hasElectron).toBeDefined();
    let filePath = '/tsconfig.json';
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/electron']).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/electron/*']
    ).toBeTruthy();
    filePath = '/xplat/electron/.xplatframework';
    fileContent = getFileContent(tree, filePath);
    // console.log(fileContent);
    expect(fileContent.indexOf('angular')).toBeGreaterThanOrEqual(0);
  });

  it('should create default xplat support with framework suffix when not specifying default', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/electron-angular/index.ts')).toBeTruthy();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(
      fileContent.compilerOptions.paths['@testing/electron-angular']
    ).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/electron-angular/*']
    ).toBeTruthy();
  });

  it('when default framework is set, can still create base platform support', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    let options: XplatHelpers.Schema = { ...defaultOptions };
    options.framework = 'angular';

    let tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/electron/index.ts')).toBeTruthy();
    let filePath = '/tsconfig.json';
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/electron']).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/electron/*']
    ).toBeTruthy();

    await expect(runSchematic('xplat', defaultOptions, tree)).rejects.toThrow(
      `You currently have "angular" set as your default frontend framework and have already generated xplat support for "web". A command is coming soon to auto reconfigure your workspace to later add baseline platform support for those which have previously been generated prepaired with a frontend framework.`
    );
  });
});
