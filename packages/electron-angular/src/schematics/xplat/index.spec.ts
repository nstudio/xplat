import { Tree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import * as path from 'path';

import {
  supportedPlatforms,
  setTest,
  jsonParse,
  IXplatSchema
} from '@nstudio/workspace';
import { createEmptyWorkspace, getFileContent } from '@nstudio/workspace/testing';
setTest();

describe('xplat schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/electron',
    path.join(__dirname, '../../../collection.json')
  );
  const defaultOptions: IXplatSchema = {
    npmScope: 'testing',
    prefix: 'ft' // foo test
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create default xplat support for electron which should always include web as well', () => {
    const options: IXplatSchema = { ...defaultOptions };

    const tree = schematicRunner.runSchematic('xplat', options, appTree);
    const files = tree.files;
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/electron/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    const packagePath = '/package.json';
    const packageFile = jsonParse(getFileContent(tree, packagePath));
    const hasScss = packageFile.dependencies[`@testing/scss`];
    expect(hasScss).not.toBeUndefined();
    const hasWebScss = packageFile.dependencies[`@testing/web`];
    expect(hasWebScss).not.toBeUndefined();
    // should not include these root packages
    const hasNativeScript = packageFile.dependencies[`nativescript-angular`];
    expect(hasNativeScript).toBeUndefined();
    const hasElectron = packageFile.devDependencies[`electron`];
    expect(hasElectron).toBeDefined();
  });
});
