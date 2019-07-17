import { Tree } from '@angular-devkit/schematics';
import { supportedPlatforms, setTest, jsonParse } from '@nstudio/xplat';
import { createEmptyWorkspace } from '@nstudio/xplat/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';
import { XplatHelpers, supportedFrameworks, stringUtils } from '../../utils';
import { getFileContent } from '@nrwl/workspace/testing';
setTest();

// TODO: Not sure how to get this unit test to work given the NodePackageInstallTask with RunSchematicTask setup
// works in use, just not sure how to get test to run right
describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatHelpers.Schema = {
    npmScope: 'testing',
    prefix: 'ft', // foo test
    isTesting: true
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should init default xplat testing support', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'web';
    options.framework = 'angular';

    const tree = await runSchematic('init', options, appTree);
    const files = tree.files;
    // console.log('files:', files);

    expect(files.indexOf('/testing/karma.conf.js')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/testing/test.libs.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/testing/test.xplat.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/testing/tsconfig.libs.json')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/testing/tsconfig.libs.spec.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/testing/tsconfig.xplat.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/testing/tsconfig.xplat.spec.json')
    ).toBeGreaterThanOrEqual(0);
  });

  it('should init platform options', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'web,nativescript';
    options.framework = 'angular';

    const tree = await runSchematic('init', options, appTree);
    const files = tree.files;
    // console.log('files:', files);

    expect(tree.exists('/testing/karma.conf.js')).toBeTruthy();
    expect(tree.exists('/testing/test.libs.ts')).toBeTruthy();
    expect(tree.exists('/testing/test.xplat.ts')).toBeTruthy();
    expect(tree.exists('/testing/tsconfig.libs.json')).toBeTruthy();
    expect(tree.exists('/testing/tsconfig.libs.spec.json')).toBeTruthy();
    expect(tree.exists('/testing/tsconfig.xplat.json')).toBeTruthy();
    expect(tree.exists('/testing/tsconfig.xplat.spec.json')).toBeTruthy();

    expect(tree.exists('/xplat/web-angular/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/web/index.ts')).toBeFalsy();
    expect(tree.exists('/xplat/nativescript-angular/index.ts')).toBeTruthy();
    expect(tree.exists('/xplat/nativescript/index.ts')).toBeFalsy();

    let packageJson = JSON.parse(getFileContent(tree, 'package.json'));
    // console.log(packageJson);
    expect(packageJson.xplat.defaultFramework).toBeUndefined();
  });

  it('should init and set options as default', async () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'web';
    options.framework = 'angular';
    options.setDefault = true;

    const tree = await runSchematic('init', options, appTree);
    // const files = tree.files;
    // console.log('files:', files);
    let packageJson = JSON.parse(getFileContent(tree, 'package.json'));
    // console.log(packageJson);
    expect(packageJson.xplat.defaultFramework).toBe('angular');
  });

  it('should NOT create unsupported platform xplat option and throw', () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'desktop';

    let tree;
    expect(
      () => (tree = runSchematicSync('init', options, appTree))
    ).toThrowError(
      `desktop is currently not a supported platform. Supported at the moment: ${supportedPlatforms}. Please request support for this platform if you'd like and/or submit a PR which we would greatly appreciate.`
    );
  });

  it('should NOT create unsupported framework xplat option and throw', () => {
    const options: XplatHelpers.Schema = { ...defaultOptions };
    options.platforms = 'web';
    options.framework = 'blah';

    let tree;
    expect(
      () => (tree = runSchematicSync('init', options, appTree))
    ).toThrowError(
      `blah is currently not a supported framework. Supported at the moment: ${supportedFrameworks.map(
        f => stringUtils.capitalize(f)
      )}. Please request support for this framework if you'd like and/or submit a PR which we would greatly appreciate.`
    );
  });
});
