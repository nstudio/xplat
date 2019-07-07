import { Tree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';

import { Schema } from './schema';
import { supportedPlatforms, setTest, jsonParse } from '@nstudio/workspace';
import { createEmptyWorkspace } from '@nstudio/workspace/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';
setTest();

describe('xplat schematic', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    npmScope: 'testing',
    prefix: 'ft' // foo test
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat testing support', async () => {
    const options: Schema = { ...defaultOptions };

    const tree = await runSchematic('xplat', options, appTree);
    const files = tree.files;

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

  it('should NOT create unsupported xplat option and throw', () => {
    const options: Schema = { ...defaultOptions };
    options.platforms = 'desktop';

    let tree;
    expect(
      () => (tree = runSchematicSync('xplat', options, appTree))
    ).toThrowError(
      `desktop is not a supported platform. Currently supported: ${supportedPlatforms}`
    );
  });
});
