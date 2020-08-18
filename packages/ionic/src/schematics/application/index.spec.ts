import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { createEmptyWorkspace } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('ionic app', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'foo',
    npmScope: 'testing',
    prefix: 'tt',
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
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
      files.indexOf('/apps/ionic-foo/capacitor.config.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/stencil.config.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/tsconfig.json')
    ).toBeGreaterThanOrEqual(0);

    // source dir
    expect(
      files.indexOf('/apps/ionic-foo/src/global/app.css')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/src/index.html')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/src/components.d.ts')
    ).toBeGreaterThanOrEqual(0);
  });

  it('should create all files for app in directory', async () => {
    const options: Schema = { ...defaultOptions };
    options.directory = 'frontend';
    const tree = await runSchematic('app', options, appTree);
    // const files = tree.files;
    // console.log(files);

    expect(tree.exists('/apps/frontend/ionic-foo/src/index.html')).toBeTruthy();
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
