import { Tree } from '@angular-devkit/schematics';
import { supportedPlatforms, setTest, jsonParse } from '@nstudio/xplat-utils';
import { XplatHelpers } from '@nstudio/xplat';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatHelpers.Schema = {
    npmScope: 'testing',
    prefix: 'ft', // foo test
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat support for nativescript only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    appTree.create('.prettierignore', '# sample');
    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/libs/xplat/web/core/src/lib/index.ts')).toBeFalsy();
    expect(
      tree.exists('/libs/xplat/nativescript/utils/src/lib/index.ts')
    ).toBeTruthy();
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    const hasNativeScript = packageFile.dependencies[`@nativescript/core`];
    expect(hasNativeScript).not.toBeUndefined();

    const prettier = getFileContent(tree, '.prettierignore');
    // console.log('prettier:', prettier);
    expect(
      prettier.indexOf('**/libs/xplat/nativescript*/plugins/**/*')
    ).toBeGreaterThan(0);
  });
});
