import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { stringUtils, XplatFeatureHelpers } from '@nstudio/xplat';
import {
  isInModuleMetadata,
  createEmptyWorkspace,
  getFileContent,
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('app', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'foo',
    npmScope: 'testing',
    routing: true,
    prefix: 'tt', // foo test
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree, 'angular');
  });

  it('should create all files of an app', async () => {
    const options: Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);
    expect(
      files.indexOf('/apps/nativescript-foo/.gitignore')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/references.d.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);

    // tools
    expect(
      files.indexOf('/apps/nativescript-foo/tools/xplat-postinstall.js')
    ).toBeGreaterThanOrEqual(0);

    // source dir
    expect(
      files.indexOf('/xplat/nativescript/utils/font-awesome.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-foo/src/features/shared/shared.module.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/fonts/fontawesome-webfont.ttf')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/scss/_index.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/scss/_variables.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/app.android.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/app.component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/app.ios.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/app.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/app.routing.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/src/main.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/nativescript-foo/src/package.json')).toBe(-1);

    // xplat file defaults
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
  });

  it('should create all files for app in directory', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'frontend';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(
      tree.exists('/apps/frontend/nativescript-foo/package.json')
    ).toBeTruthy();
    const fileContent = getFileContent(
      tree,
      '/apps/frontend/nativescript-foo/tsconfig.json'
    );
    // console.log('tsconfig:', fileContent)
    expect(
      fileContent.indexOf('../../../xplat/nativescript/*')
    ).toBeGreaterThanOrEqual(0);
  });

  it('should create all files for app in directory and ignore platform naming when directory is a platform', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'nativescript';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/nativescript/foo/package.json')).toBeTruthy();
  });

  it('should create CoreModule with import from xplat', async () => {
    const options = { ...defaultOptions };
    const tree = await runSchematic('app', options, appTree);
    const appModule = getFileContent(
      tree,
      '/apps/nativescript-foo/src/core/core.module.ts'
    );

    expect(appModule).toMatch(
      isInModuleMetadata(
        'CoreModule',
        'imports',
        `${stringUtils.classify(options.prefix)}CoreModule`,
        true
      )
    );
    expect(appModule).toMatch(
      `import { ${stringUtils.classify(options.prefix)}CoreModule } from \'@${
        options.npmScope
      }/nativescript\'`
    );
  });

  it('should create CoreModule with import from xplat with framework name when no default is set', async () => {
    const options = { ...defaultOptions };
    appTree.overwrite(
      '/package.json',
      JSON.stringify({
        dependencies: {},
        devDependencies: {},
        xplat: {
          prefix: 'tt',
        },
      })
    );
    const tree = await runSchematic('app', options, appTree);
    const appModule = getFileContent(
      tree,
      '/apps/nativescript-foo/src/core/core.module.ts'
    );

    expect(appModule).toMatch(
      isInModuleMetadata(
        'CoreModule',
        'imports',
        `${stringUtils.classify(options.prefix)}CoreModule`,
        true
      )
    );
    expect(appModule).toMatch(
      `import { ${stringUtils.classify(options.prefix)}CoreModule } from \'@${
        options.npmScope
      }/nativescript-angular\'`
    );
  });

  it('should create root NgModule with bootstrap information', async () => {
    const options = { ...defaultOptions };
    const tree = await runSchematic('app', options, appTree);
    const appModule = getFileContent(
      tree,
      '/apps/nativescript-foo/src/app.module.ts'
    );

    expect(appModule).toMatch(
      isInModuleMetadata('AppModule', 'bootstrap', 'AppComponent', true)
    );
    expect(appModule).toMatch(
      isInModuleMetadata('AppModule', 'declarations', 'AppComponent', true)
    );
    expect(appModule).toMatch(
      isInModuleMetadata('AppModule', 'imports', 'CoreModule', true)
    );
    expect(appModule).toMatch(
      isInModuleMetadata('AppModule', 'imports', 'SharedModule', true)
    );
    expect(appModule).toMatch(
      isInModuleMetadata('AppModule', 'imports', 'AppRoutingModule', true)
    );
    expect(appModule).toMatch("import { AppComponent } from './app.component'");
  });

  it('should create a root routing module with --routing', async () => {
    const options = { ...defaultOptions };
    options.routing = true;
    const tree = await runSchematic('app', options, appTree);
    const appModule = getFileContent(
      tree,
      '/apps/nativescript-foo/src/app.routing.ts'
    );

    expect(appModule).toMatch(`loadChildren: () =>`);
  });

  it('should create a sandbox app with --setupSandbox and feature should work as expected', async () => {
    const options = { ...defaultOptions };
    // options.name = 'sandbox';
    options.routing = false;
    options.setupSandbox = true;
    let tree = await runSchematic('app', options, appTree);
    let fileContent = getFileContent(
      tree,
      '/apps/nativescript-foo/src/app.routing.ts'
    );

    expect(fileContent).toMatch(`loadChildren: () =>`);
    fileContent = getFileContent(
      tree,
      '/apps/nativescript-foo/src/features/home/components/home.component.html'
    );
    // console.log(fileContent);
    expect(
      fileContent.indexOf('Use feature generator to add pages')
    ).toBeGreaterThanOrEqual(0);

    const featureOptions: XplatFeatureHelpers.Schema = {
      name: 'foo-with-dash',
      adjustSandbox: true,
      projects: 'nativescript-foo',
    };
    tree = await runSchematic('feature', featureOptions, tree);
    fileContent = getFileContent(
      tree,
      '/apps/nativescript-foo/src/features/home/components/home.component.html'
    );
    // console.log(fileContent);
    expect(
      fileContent.indexOf(
        `<Button text="Dash" (tap)="goTo('/foo-with-dash')" class="btn"></Button>`
      )
    ).toBeGreaterThanOrEqual(0);
  });

  it('should create all files of an app using groupByName', async () => {
    const options: Schema = { ...defaultOptions };
    options.groupByName = true;
    // console.log('appTree:', appTree);
    const tree = await runSchematic('app', options, appTree);
    const files = tree.files;
    // console.log(files);
    expect(
      files.indexOf('/apps/foo-nativescript/.gitignore')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/foo-nativescript/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/foo-nativescript/references.d.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/foo-nativescript/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);

    // tools
    expect(
      files.indexOf('/apps/foo-nativescript/tools/xplat-postinstall.js')
    ).toBeGreaterThanOrEqual(0);

    const packageFile = getFileContent(tree, 'package.json');
    // console.log(packageFile)
  });

  describe('useXplat false', () => {
    it('should geneate app with no connections to xplat architecture', async () => {
      appTree = Tree.empty();
      appTree = createEmptyWorkspace(appTree, 'angular');
      const options: Schema = { ...defaultOptions };
      options.useXplat = false;
      // console.log('appTree:', appTree);
      const tree = await runSchematic('app', options, appTree);
      // const files = tree.files;
      // console.log(files);
      expect(tree.exists('/apps/nativescript-foo/src/main.ts')).toBeTruthy();
      expect(
        tree.exists('/apps/nativescript-foo/src/app/app.module.ts')
      ).toBeTruthy();
      expect(
        tree.exists('/apps/nativescript-foo/src/app/app.component.ts')
      ).toBeTruthy();

      expect(tree.exists('/xplat/nativescript/index.ts')).toBeFalsy();
    });
  });
});
