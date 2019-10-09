import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { stringUtils, XplatFeatureHelpers } from '@nstudio/xplat';
import {
  isInModuleMetadata,
  createEmptyWorkspace,
  getFileContent,
  createXplatWithNativeScriptWeb
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('native-ui', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'my-view'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree);
  });

  it('should create native ui files', async () => {
    const options: Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('native-ui', options, appTree);
    const files = tree.files;
    console.log(files);

    const fileContents = getFileContent(tree, '/xplat/nativescript/features/native-ui/my-view/my-view.ios.ts');
    console.log(fileContents);

    expect(
      fileContents.indexOf(`export class MyView extends View {`)
    ).toBeGreaterThanOrEqual(0);
  });
});