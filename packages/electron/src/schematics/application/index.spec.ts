import { Tree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
import { Schema as ApplicationOptions } from './schema';
import { jsonParse } from '@nstudio/workspace';
import {
  createXplatWithAppsForElectron
} from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';

describe('app', () => {
  let appTree: Tree;
  const defaultOptions: ApplicationOptions = {
    name: 'foo',
    target: 'web-viewer',
    npmScope: 'testing',
    prefix: 'tt'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithAppsForElectron(appTree);
  });

  it('should create all files of an app', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);
    let checkPath = '/apps/electron-foo/src/index.ts';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    expect(
      checkFile.indexOf(`path.join(__dirname, 'index.html')`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/electron-foo/src/icons/icon.png')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/electron-foo/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);

    checkPath = '/apps/electron-foo/src/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    expect(checkFile.indexOf(`"name": "foo"`)).toBeGreaterThanOrEqual(0);

    expect(
      files.indexOf('/tools/electron/postinstall.js')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/tools/web/postinstall.js')).toBeGreaterThanOrEqual(
      0
    );

    checkPath = '/package.json';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts['postinstall']).toBeDefined();
    expect(packageData.scripts['postinstall.electron']).toBeDefined();
    expect(packageData.scripts['postinstall.web']).toBeDefined();
    expect(packageData.scripts['build.electron.foo']).toBeDefined();
    expect(packageData.scripts['build.electron.foo.local']).toBeDefined();
    expect(packageData.scripts['build.electron.foo.linux']).toBeDefined();
    expect(packageData.scripts['build.electron.foo.windows']).toBeDefined();
    expect(packageData.scripts['build.electron.foo.mac']).toBeDefined();
    expect(packageData.scripts['prepare.electron.foo']).toBeDefined();
    expect(packageData.scripts['serve.electron.foo.target']).toBeDefined();
    expect(packageData.scripts['serve.electron.foo']).toBeDefined();
    expect(packageData.scripts['start.electron.foo']).toBeDefined();

    // check target web app for supporting files
    checkPath = '/apps/web-viewer/src/app/app.electron.module.ts';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    expect(checkFile.indexOf(`TtElectronCoreModule`)).toBeGreaterThanOrEqual(0);
    expect(checkFile.indexOf(`AppElectronModule`)).toBeGreaterThanOrEqual(0);

    checkPath = '/apps/web-viewer/src/main.electron.ts';
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    expect(
      checkFile.indexOf(`./app/app.electron.module`)
    ).toBeGreaterThanOrEqual(0);

    // make sure start script is correct
    checkPath = '/package.json';
    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    expect(
      checkFile.indexOf(
        `npm run prepare.electron.${
          options.name
        } && npm-run-all -p serve.electron.${
          options.name
        }.target serve.electron.${options.name}`
      )
    ).toBeGreaterThanOrEqual(0);
  });
});
