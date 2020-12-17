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
    platforms: 'web',
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree, 'angular');
  });

  it('should create default xplat support for web only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/libs/xplat/web/core/src/lib/index.ts')).toBeTruthy();
    expect(tree.exists('/libs/xplat/nativescript/core/src/lib/index.ts')).toBeFalsy();
    let filePath = getRootTsConfigPath();
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/xplat/web/core']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/xplat/web/features']).toBeTruthy();
    filePath = '/package.json';
    fileContent = jsonParse(getFileContent(tree, filePath));
    // const hasScss = packageFile.dependencies[`@testing/scss`];
    // expect(hasScss).not.toBeUndefined();
    // should not include these root packages
    const hasNativeScript = fileContent.dependencies[`nativescript-angular`];
    expect(hasNativeScript).toBeUndefined();
  });

  it('should create default xplat support with framework suffix when not specifying default', async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/libs/xplat/web-angular/core/src/lib/index.ts')).toBeTruthy();
    const filePath = getRootTsConfigPath();
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(
      fileContent.compilerOptions.paths['@testing/xplat/web-angular/core']
    ).toBeTruthy();
    expect(
      fileContent.compilerOptions.paths['@testing/xplat/web-angular/features']
    ).toBeTruthy();
  });
});
