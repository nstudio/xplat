import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { getRootTsConfigPath, jsonParse } from '@nstudio/xplat-utils';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('app', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'foo',
    skipFormat: true,
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create all files for web app', async () => {
    const options: Schema = { ...defaultOptions };
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/web-foo/tsconfig.json')).toBeTruthy();
    expect(tree.exists('/apps/web-foo/src/main.ts')).toBeTruthy();
    expect(tree.exists('/apps/web-foo/src/app/app.module.ts')).toBeTruthy();

    expect(
      tree.exists('/apps/web-foo/src/app/app.component.html')
    ).toBeTruthy();
    expect(
      tree.exists('/apps/web-foo/src/app/core/core.module.ts')
    ).toBeTruthy();

    expect(tree.exists('/package.json')).toBeTruthy();

    let checkFile = getFileContent(tree, '/package.json');
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.web.foo']).toBeDefined();

    // should gen xplat structure by default
    expect(tree.exists('/xplat/web/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/web/core/index.ts')).toBeTruthy();
  });

  it('should create all files for web app using groupByName', async () => {
    const options: Schema = { ...defaultOptions };
    options.groupByName = true;
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(files.indexOf('/apps/foo-web/tsconfig.json')).toBeGreaterThanOrEqual(
      0
      );
    let checkPath = getRootTsConfigPath();
    let checkFile = getFileContent(tree, checkPath);
    // console.log('tsconfig.base:', checkFile);
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(
      0
    );
    expect(files.indexOf('/tsconfig.json')).toBeGreaterThanOrEqual(
      0
    );
    expect(files.indexOf('/apps/foo-web/src/main.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/foo-web/src/app/app.module.ts')
    ).toBeGreaterThanOrEqual(0);

    checkPath = '/apps/foo-web/src/app/app.component.html';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.foo.web']).toBeDefined();
  });

  it('should create all files for web app in directory', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'frontend';
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/frontend/web-foo/tsconfig.json')).toBeTruthy();
    expect(tree.exists('/apps/frontend/web-foo/src/main.ts')).toBeTruthy();
    expect(
      tree.exists('/apps/frontend/web-foo/src/app/app.module.ts')
    ).toBeTruthy();
  });

  it('should create all files for web app in directory and ignore platform naming when directory is a platform', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'web';
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/web/foo/tsconfig.json')).toBeTruthy();
    expect(tree.exists('/apps/web/foo/src/main.ts')).toBeTruthy();
    expect(tree.exists('/apps/web/foo/src/app/app.module.ts')).toBeTruthy();
  });

  it('should create all files for web app using addHeadlessE2e', async () => {
    const options: Schema = {
      ...defaultOptions,
      addHeadlessE2e: true,
    };
    options.e2eTestRunner = 'protractor';
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    const appName = 'web-foo';
    // console.log(files);

    expect(
      files.indexOf(`/apps/${appName}/tsconfig.json`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`/apps/${appName}/src/main.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`/apps/${appName}/src/app/app.module.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`/apps/${appName}-e2e/protractor.headless.js`)
    ).toBeGreaterThanOrEqual(0);

    let checkPath = `/apps/${appName}/src/app/app.component.html`;
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.web.foo']).toBeDefined();

    checkPath = '/angular.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const angularJson: any = jsonParse(checkFile);
    expect(
      angularJson.projects[`${appName}-e2e`].architect.e2e.configurations.ci
    ).toBeDefined();
  });

  // it('should create app with --framework flag Ionic', async () => {
  //   const options: Schema = { ...defaultOptions };
  //   const tree = await runSchematic('app', options, appTree);
  //   const files = tree.files;
  //   // console.log(files);

  //   expect(
  //     files.indexOf('/apps/ionic-foo/package.json')
  //   ).toBeGreaterThanOrEqual(0);

  //   const checkPath = '/package.json';
  //   expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

  //   let checkFile = getFileContent(tree, checkPath);
  //   // console.log(checkFile);
  //   const packageData: any = jsonParse(checkFile);
  //   expect(packageData.scripts['start.ionic.foo']).toBeDefined();
  // });

  // it('should create app with --framework flag for NativeScript', async () => {
  //   const options: Schema = { ...defaultOptions };
  //   options.framework = Framework.NativeScript;
  //   const tree = await runSchematic('app', options, appTree);
  //   const files = tree.files;
  //   // console.log(files);

  //   expect(
  //     files.indexOf('/apps/nativescript-foo/package.json')
  //   ).toBeGreaterThanOrEqual(0);

  //   const checkPath = '/package.json';
  //   expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

  //   let checkFile = getFileContent(tree, checkPath);
  //   // console.log(checkFile);
  //   const packageData: any = jsonParse(checkFile);
  //   expect(packageData.scripts['start.nativescript.foo.ios']).toBeDefined();
  // });

  describe('useXplat false', () => {
    it('should geneate app with no connections to xplat architecture', async () => {
      const options: Schema = { ...defaultOptions };
      options.useXplat = false;
      // console.log('appTree:', appTree);
      const tree = await runSchematic('app', options, appTree);
      // const files = tree.files;
      // console.log(files);
      expect(
        tree.exists('/apps/web-foo/src/app/app.component.html')
      ).toBeTruthy();
      expect(
        tree.exists('/apps/web-foo/src/app/core/core.module.ts')
      ).toBeFalsy();
      expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
    });
  });
});
