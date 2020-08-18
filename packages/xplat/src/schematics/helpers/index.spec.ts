import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { stringUtils, XplatHelpers } from '@nstudio/xplat';
import {
  setTest
} from '@nstudio/xplat-utils';
import {
  isInModuleMetadata,
  createEmptyWorkspace,
  getFileContent
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
setTest();

describe('xplat-helper schematic', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('generating helper for a platform where the helper is not supported should not do anything', async () => {
    const optionsXplat: XplatHelpers.Schema = {
      npmScope: 'testing',
      prefix: 'tt',
      platforms: 'web,nativescript'
    };

    appTree = await runSchematic('init', optionsXplat, appTree);
    const options: Schema = {
      name: 'imports',
      platforms: 'web'
    };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('helpers', options, appTree);
    const files = tree.files;
    // console.log(files);

    // xplat helpers
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/core.ts')
    ).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/ui.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/angular/core.ts')
    ).toBe(-1);
  });
});
