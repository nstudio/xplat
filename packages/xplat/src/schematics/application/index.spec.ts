import { Tree } from '@angular-devkit/schematics';
import { supportedPlatforms, setTest, jsonParse } from '@nstudio/xplat';
import { createEmptyWorkspace } from '@nstudio/xplat/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';
import { XplatHelpers, supportedFrameworks, stringUtils } from '../../utils';
import { getFileContent } from '@nrwl/workspace/testing';
import { Schema } from './schema';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'sample',
    prefix: 'tt', // foo test
    isTesting: true
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create web angular app', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'web';
    options.framework = 'angular';

    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log('files:', files);

    expect(tree.exists('/apps/web-sample/tsconfig.json')).toBeTruthy();
    expect(
      tree.exists('/apps/web-sample/src/app/app.component.html')
    ).toBeTruthy();
    expect(
      tree.exists('/apps/web-sample/src/app/features/shared/shared.module.ts')
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/web-sample/src/app/features/home/components/home.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/web-sample/src/app/features/home/components/home.component.ts'
      )
    ).toBeTruthy();
  });

  it('should create nativescript angular app', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'nativescript';
    options.framework = 'angular';

    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log('files:', files);

    expect(tree.exists('/apps/nativescript-sample/nsconfig.json')).toBeTruthy();
    expect(
      tree.exists('/apps/nativescript-sample/webpack.config.js')
    ).toBeTruthy();
    expect(
      tree.exists('/apps/nativescript-sample/src/app.module.ts')
    ).toBeTruthy();
    expect(
      tree.exists('/apps/nativescript-sample/src/assets/fontawesome.min.css')
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/nativescript-sample/src/features/shared/shared.module.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists('/apps/nativescript-sample/App_Resources/iOS/Info.plist')
    ).toBeTruthy();
  });

  // describe('Nx app generators supporte via proxy xplat app generator', () => {
  //   it('should create Nx express', async () => {
  //     const options: XplatHelpers.Schema = { ...defaultOptions };
  //     options.platforms = 'express';

  //     const tree = await runSchematic('app', options, appTree);
  //     const files = tree.files;
  //     console.log('files:', files);

  //     // expect(tree.exists('/apps/nativescript-sample/nsconfig.json')).toBeTruthy();
  //   });
  // });
});
