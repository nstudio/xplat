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
    prefix: 'ft' // foo test
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
  });
});
