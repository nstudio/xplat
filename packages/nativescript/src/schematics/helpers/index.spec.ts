import { Tree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
import { Schema as AppNativeScriptOptions } from '../application/schema';
// import { Schema as XPlatOptions } from '../xplat/schema';
import {
  stringUtils,
  setTest,
  jsonParse,
  IHelperSchema
} from '@nstudio/workspace';
import {
  createXplatWithApps
} from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('helpers schematic', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithApps(appTree);
  });

  it('imports: should create all files', async () => {
    const appOptions: AppNativeScriptOptions = {
      name: 'foo',
      npmScope: 'testing',
      sample: true,
      prefix: 'tt' // foo test
    };
    // console.log('appTree:', appTree);
    appTree = await runSchematic('app', appOptions, appTree);

    const options: IHelperSchema = {
      name: 'imports'
    };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('helpers', options, appTree);
    const files = tree.files;
    // console.log(files);

    // xplat helpers
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/core.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/ui.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/angular/core.ts')
    ).toBeGreaterThanOrEqual(0);

    // should update tsconfig files
    let filePath = '/tsconfig.json';
    let fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@nativescript/*'][0]).toBe(
      'xplat/nativescript/utils/@nativescript/*'
    );

    filePath = '/apps/nativescript-foo/tsconfig.json';
    fileContent = jsonParse(getFileContent(tree, filePath));
    // console.log(fileContent);
    expect(fileContent.compilerOptions.paths['@nativescript/*'][0]).toBe(
      '../../xplat/nativescript/utils/@nativescript/*'
    );
  });
});
