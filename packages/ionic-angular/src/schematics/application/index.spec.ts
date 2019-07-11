import { Tree } from '@angular-devkit/schematics';
import { Schema as ApplicationOptions } from './schema';
import { createEmptyWorkspace } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('app.ionic schematic', () => {
  let appTree: Tree;
  const defaultOptions: ApplicationOptions = {
    name: 'foo',
    npmScope: 'testing',
    prefix: 'tt'
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
    expect(files.indexOf('/apps/ionic-foo/.gitignore')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/apps/ionic-foo/angular.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/ionic-foo/capacitor.config.json')
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
  });
});
