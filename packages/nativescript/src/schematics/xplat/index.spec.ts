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

  it('should create default xplat support for nativescript only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    const hasNativeScript = packageFile.dependencies[`nativescript-angular`];
    expect(hasNativeScript).not.toBeUndefined();
  });
});
