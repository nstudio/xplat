import { Tree } from '@angular-devkit/schematics';
import { XplatElectrontHelpers } from '@nstudio/electron';
import { jsonParse } from '@nstudio/xplat';
import {
  createXplatWithAppsForElectron,
  getFileContent,
  createEmptyWorkspace
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('app', () => {
  let appTree: Tree;
  const defaultOptions: XplatElectrontHelpers.SchemaApp = {
    name: 'foo',
    target: 'web-viewer',
    npmScope: 'testing',
    prefix: 'tt',
    isTesting: true
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithAppsForElectron(appTree);
  });

  it('should create all files of an app', async () => {
    const options: XplatElectrontHelpers.SchemaApp = { ...defaultOptions };
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

  it('should create all files for app in directory', async () => {
    const options: XplatElectrontHelpers.SchemaApp = { ...defaultOptions };
    options.directory = 'frontend';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(
      tree.exists('/apps/frontend/electron-foo/src/index.ts')
    ).toBeTruthy();
  });

  it('should create all files for app in directory and ignore platform naming when directory is a platform', async () => {
    const options: XplatElectrontHelpers.SchemaApp = { ...defaultOptions };
    options.directory = 'electron';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/electron/foo/src/index.ts')).toBeTruthy();
  });

  describe('useXplat false', () => {
    it('should geneate app with no connections to xplat architecture', async () => {
      appTree = Tree.empty();
      appTree.create('/apps/web-viewer/package.json', JSON.stringify({}));
      appTree.create(
        'angular.json',
        JSON.stringify({
          version: 1,
          projects: {
            'web-viewer': {
              architect: {
                build: {
                  options: {
                    assets: []
                  }
                },
                serve: {
                  options: {},
                  configurations: {
                    production: {}
                  }
                }
              }
            }
          }
        })
      );
      appTree.create(
        '/package.json',
        JSON.stringify({
          dependencies: {},
          devDependencies: {},
          xplat: {}
        })
      );
      appTree.create(
        '/nx.json',
        JSON.stringify({ npmScope: 'testing', projects: {} })
      );
      appTree.create(
        '/tsconfig.json',
        JSON.stringify({ compilerOptions: { paths: {} } })
      );
      const options: XplatElectrontHelpers.SchemaApp = { ...defaultOptions };
      options.useXplat = false;
      // console.log('appTree:', appTree);
      const tree = await runSchematic('app', options, appTree);
      // const files = tree.files;
      // console.log(files);
      expect(tree.exists('/tools/electron/postinstall.js')).toBeTruthy();
      expect(tree.exists('/tools/web/postinstall.js')).toBeTruthy();

      // should *not* create this
      expect(tree.exists('/apps/web-viewer/src/main.electron.ts')).toBeFalsy();
    });
  });
});
