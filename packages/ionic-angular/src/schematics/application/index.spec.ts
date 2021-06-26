import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { createEmptyWorkspace, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('app.ionic schematic', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'foo',
    npmScope: 'testing',
    prefix: 'tt',
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
    expect(files.indexOf('/apps/ionic-foo/.gitignore')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/ionic-foo/capacitor.config.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/ionic.config.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);

    // source dir
    expect(
      files.indexOf('/apps/ionic-foo/src/global.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/src/index.html')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/ionic-foo/src/main.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/ionic-foo/src/polyfills.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/apps/ionic-foo/src/test.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/ionic-foo/src/theme/variables.scss')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/src/app/app.component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/src/app/app.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/src/app/app-routing.module.ts')
    ).toBeGreaterThanOrEqual(0);

    expect(tree.exists('/libs/xplat/web/scss/src/_index.scss')).toBeTruthy();
    expect(tree.exists('/libs/xplat/ionic/scss/src/_index.scss')).toBeTruthy();
  });

  it('should create all files for app in directory', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'frontend';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/frontend/ionic-foo/src/index.html')).toBeTruthy();
  });

  it('should create all files for app without xplat when useXplat is false', async () => {
    const options: Schema = { ...defaultOptions };
    options.useXplat = false;
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);
    const content = getFileContent(
      tree,
      '/apps/ionic-foo/src/app/app.module.ts'
    );
    // console.log('content:', content);
    expect(
      content.indexOf(
        `import { IonicModule, IonicRouteStrategy } from '@ionic/angular';`
      )
    ).toBeGreaterThan(0);
  });

  it('should create all files for app in directory and ignore platform naming when directory is a platform', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'ionic';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/ionic/foo/src/index.html')).toBeTruthy();
  });
});
