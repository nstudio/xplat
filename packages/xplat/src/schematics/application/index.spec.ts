import { Tree } from '@angular-devkit/schematics';
import {
  supportedPlatforms,
  setTest,
  jsonParse,
  supportedFrameworks,
} from '@nstudio/xplat-utils';
import { createEmptyWorkspace } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
import { XplatHelpers, stringUtils } from '../../utils';
import { getFileContent } from '@nx/workspace/testing';
import { Schema } from './schema';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'sample',
    prefix: 'tt', // foo test
    isTesting: true,
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

    expect(
      tree.exists('/apps/nativescript-sample/nativescript.config.ts')
    ).toBeTruthy();
    expect(
      tree.exists('/apps/nativescript-sample/src/app.module.ts')
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

  describe('Nx app generators supporte via proxy xplat app generator', () => {
    it('should create Nx express', async () => {
      appTree = Tree.empty();
      appTree = createEmptyWorkspace(appTree);
      const options: XplatHelpers.Schema = { ...defaultOptions };
      options.platforms = 'express';

      const tree = await runSchematic('app', options, appTree);
      const files = tree.files;
      // console.log('files:', files);

      expect(tree.exists('/apps/express-sample/src/main.ts')).toBeTruthy();

      let fileContent = getFileContent(
        tree,
        '/apps/express-sample/src/main.ts'
      );
      // console.log(fileContent);
      expect(fileContent.indexOf(`from 'express'`)).toBeGreaterThan(0);
    });

    xit('should create Nx nest', async () => {
      appTree = Tree.empty();
      appTree = createEmptyWorkspace(appTree);
      const options: XplatHelpers.Schema = { ...defaultOptions };
      options.platforms = 'nest';
      delete options.prefix;
      delete options.isTesting;

      const tree = await runSchematic('app', options, appTree);
      const files = tree.files;
      // console.log('files:', files);
      expect(tree.exists('/apps/nest-sample/src/main.ts')).toBeTruthy();

      let fileContent = getFileContent(tree, '/apps/nest-sample/src/main.ts');
      // console.log(fileContent);
      expect(fileContent.indexOf(`from '@nestjs/core'`)).toBeGreaterThan(0);
    });

    xit('should create Nx node', async () => {
      appTree = Tree.empty();
      appTree = createEmptyWorkspace(appTree);
      const options: XplatHelpers.Schema = { ...defaultOptions };
      options.platforms = 'node';
      delete options.prefix;
      delete options.isTesting;

      const tree = await runSchematic('app', options, appTree);
      const files = tree.files;
      // console.log('files:', files);

      expect(tree.exists('/apps/node-sample/src/main.ts')).toBeTruthy();

      let fileContent = getFileContent(tree, '/apps/node-sample/src/main.ts');
      // console.log(fileContent);
      expect(
        fileContent.indexOf(`console.log('Hello World!')`)
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
