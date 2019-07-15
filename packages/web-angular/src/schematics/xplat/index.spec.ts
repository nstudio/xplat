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
    platforms: 'web'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat support for web only', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/web-angular/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/nativescript-angular/index.ts')).toBeFalsy();
    let filePath = '/tsconfig.json';
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/web-angular']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/web-angular/*']).toBeTruthy();
    filePath = '/package.json';
    fileContent = jsonParse(getFileContent(tree, filePath));
    // const hasScss = packageFile.dependencies[`@testing/scss`];
    // expect(hasScss).not.toBeUndefined();
    // should not include these root packages
    const hasNativeScript = fileContent.dependencies[`nativescript-angular`];
    expect(hasNativeScript).toBeUndefined();
  });

  it('should create default xplat support without framework suffix when specifying default', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.framework = 'angular';
    options.setDefault = true;

    const tree = await runSchematic('xplat', options, appTree);
    expect(tree.exists('/xplat/web/index.ts')).toBeTruthy();
    const filePath = '/tsconfig.json';
    const fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@testing/web']).toBeTruthy();
    expect(fileContent.compilerOptions.paths['@testing/web/*']).toBeTruthy();
  });
});
