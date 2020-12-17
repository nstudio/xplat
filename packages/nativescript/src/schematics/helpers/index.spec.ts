import { Tree } from '@angular-devkit/schematics';
import { Schema } from '../application/schema';
import { setTest, jsonParse, getRootTsConfigPath } from '@nstudio/xplat-utils';
import { IHelperSchema, stringUtils } from '@nstudio/xplat';
import {
  createXplatWithApps,
  getFileContent,
  createXplatWithNativeScriptWeb,
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('helpers schematic', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree);
  });

  // No longer needed: keeping here as example for future potential for similar helpers
  xit('imports: should create all files', async () => {
    const options: IHelperSchema = {
      name: 'imports',
    };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('helpers', options, appTree);
    const files = tree.files;
    // console.log(files);

    // xplat helpers
    expect(
      tree.exists('/xplat/nativescript/utils/@nativescript/core.ts')
    ).toBeTruthy();
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/ui.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/angular/core.ts')
    ).toBeGreaterThanOrEqual(0);

    // should update tsconfig files
    let filePath = getRootTsConfigPath();
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@nativescript/*'][0]).toBe(
      'libs/xplat/nativescript/utils/@nativescript/*'
    );

    filePath = '/apps/nativescript-viewer/tsconfig.json';
    fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@nativescript/*'][0]).toBe(
      '../../xplat/nativescript/utils/@nativescript/*'
    );
  });
});
