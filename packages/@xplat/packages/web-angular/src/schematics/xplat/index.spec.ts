import { Tree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
import {
  supportedPlatforms,
  setTest,
  jsonParse,
  IXplatSchema
} from '@nstudio/workspace';
import { createEmptyWorkspace } from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: IXplatSchema = {
    npmScope: 'testing',
    prefix: 'ft' // foo test
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat support for web only', async () => {
    const options: IXplatSchema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    const files = tree.files;
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    const hasScss = packageFile.dependencies[`@testing/scss`];
    expect(hasScss).not.toBeUndefined();
    // should not include these root packages
    const hasNativeScript = packageFile.dependencies[`nativescript-angular`];
    expect(hasNativeScript).toBeUndefined();
  });
});
