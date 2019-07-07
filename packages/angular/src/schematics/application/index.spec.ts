import { Tree } from '@angular-devkit/schematics';
import { Schema as ApplicationOptions } from './schema';
import { Framework, jsonParse, getFileContent } from '@nstudio/workspace';
import { createEmptyWorkspace } from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';

describe('app', () => {
  let appTree: Tree;
  const defaultOptions: ApplicationOptions = {
    name: 'foo',
    skipFormat: true
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create all files for web app', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(files.indexOf('/apps/web-foo/tsconfig.json')).toBeGreaterThanOrEqual(
      0
    );
    expect(files.indexOf('/apps/web-foo/src/main.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/web-foo/src/app/app.module.ts')
    ).toBeGreaterThanOrEqual(0);

    let checkPath = '/apps/web-foo/src/app/app.component.html';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.web.foo']).toBeDefined();
  });

  it('should create all files for web app using groupByName', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    options.groupByName = true;
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(files.indexOf('/apps/foo-web/tsconfig.json')).toBeGreaterThanOrEqual(
      0
    );
    expect(files.indexOf('/apps/foo-web/src/main.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/foo-web/src/app/app.module.ts')
    ).toBeGreaterThanOrEqual(0);

    let checkPath = '/apps/foo-web/src/app/app.component.html';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.foo.web']).toBeDefined();
  });

  it('should create all files for web app using addHeadlessE2e', async () => {
    const options: ApplicationOptions = {
      ...defaultOptions,
      addHeadlessE2e: true
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

  it('should create app with --framework flag Ionic', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    options.framework = Framework.Ionic;
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(
      files.indexOf('/apps/ionic-foo/package.json')
    ).toBeGreaterThanOrEqual(0);

    const checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.ionic.foo']).toBeDefined();
  });

  it('should create app with --framework flag for NativeScript', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    options.framework = Framework.NativeScript;
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(
      files.indexOf('/apps/nativescript-foo/package.json')
    ).toBeGreaterThanOrEqual(0);

    const checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['start.nativescript.foo.ios']).toBeDefined();
  });
});
