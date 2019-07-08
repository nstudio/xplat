import { Tree } from '@angular-devkit/schematics';
import { Schema as FeatureOptions } from '@nstudio/angular/src/schematics/feature/schema';
import { Schema as ApplicationOptions } from './schema';
import { stringUtils } from '@nstudio/workspace';
import {
  isInModuleMetadata,
  createEmptyWorkspace,
  getFileContent
} from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';

describe('app', () => {
  let appTree: Tree;
  const defaultOptions: ApplicationOptions = {
    name: 'foo',
    npmScope: 'testing',
    routing: true,
    prefix: 'tt' // foo test
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create all files of an app', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
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
      files.indexOf('/apps/nativescript-foo/tsconfig.tns.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/webpack.config.js')
    ).toBeGreaterThanOrEqual(0);

    // tools
    expect(
      files.indexOf('/apps/nativescript-foo/tools/xplat-postinstall.js')
    ).toBeGreaterThanOrEqual(0);

    // source dir
    expect(
      files.indexOf('/apps/nativescript-foo/app/assets/fontawesome.min.css')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-foo/app/features/shared/shared.module.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/fonts/fontawesome-webfont.ttf')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/scss/_index.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/scss/_variables.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/app.android.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/app.component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/app.ios.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/app.module.ngfactory.d.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/app.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/app.routing.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/main.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-foo/app/package.json')
    ).toBeGreaterThanOrEqual(0);

    // xplat file defaults
    expect(files.indexOf('/xplat/nativescript/index.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/index.ts')).toBe(-1);
  });

  it('should create CoreModule with import from shared code', async () => {
    const options = { ...defaultOptions };
    const tree = await runSchematic(
      'app',
      options,
      appTree
    );
    const appModule = getFileContent(
      tree,
      '/apps/nativescript-foo/app/core/core.module.ts'
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

  it('should create root NgModule with bootstrap information', async () => {
    const options = { ...defaultOptions };
    const tree = await runSchematic('app', options, appTree);
    const appModule = getFileContent(
      tree,
      '/apps/nativescript-foo/app/app.module.ts'
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
      '/apps/nativescript-foo/app/app.routing.ts'
    );

    expect(appModule).toMatch(
      `loadChildren: '~/features/home/home.module#HomeModule'`
    );
  });

  it('should create a sandbox app with --setupSandbox and feature should work as expected', async () => {
    const options = { ...defaultOptions };
    // options.name = 'sandbox';
    options.routing = false;
    options.setupSandbox = true;
    let tree = await runSchematic('app', options, appTree);
    let fileContent = getFileContent(
      tree,
      '/apps/nativescript-foo/app/app.routing.ts'
    );

    expect(fileContent).toMatch(
      `loadChildren: '~/features/home/home.module#HomeModule'`
    );
    fileContent = getFileContent(
      tree,
      '/apps/nativescript-foo/app/features/home/components/home.component.html'
    );
    // console.log(fileContent);
    expect(
      fileContent.indexOf('Use feature generator to add pages')
    ).toBeGreaterThanOrEqual(0);

    const featureOptions: FeatureOptions = {
      name: 'foo-with-dash',
      adjustSandbox: true,
      projects: 'nativescript-foo'
    };
    tree = await runSchematic('feature', featureOptions, tree);
    fileContent = getFileContent(
      tree,
      '/apps/nativescript-foo/app/features/home/components/home.component.html'
    );
    // console.log(fileContent);
    expect(
      fileContent.indexOf(
        `<Button text="Dash" (tap)="goTo('/foo-with-dash')" class="btn"></Button>`
      )
    ).toBeGreaterThanOrEqual(0);
  });

  it('should create all files of an app using groupByName', async () => {
    const options: ApplicationOptions = { ...defaultOptions };
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
      files.indexOf('/apps/foo-nativescript/tsconfig.tns.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/foo-nativescript/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/foo-nativescript/webpack.config.js')
    ).toBeGreaterThanOrEqual(0);

    // tools
    expect(
      files.indexOf('/apps/foo-nativescript/tools/xplat-postinstall.js')
    ).toBeGreaterThanOrEqual(0);

    const packageFile = getFileContent(tree, 'package.json');
    // console.log(packageFile)
    expect(
      packageFile.indexOf('start.foo.nativescript.ios')
    ).toBeGreaterThanOrEqual(0);
  });
});
