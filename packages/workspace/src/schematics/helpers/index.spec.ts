import { Tree } from '@angular-devkit/schematics';
import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as XPlatOptions } from '../xplat/schema';
import { Schema as HelperOptions } from './schema';
import { stringUtils, setTest, jsonParse } from '@nstudio/workspace';
import {
  isInModuleMetadata,
  createEmptyWorkspace
} from '@nstudio/workspace/testing';
setTest();

describe('xplat-helper schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/workspace',
    path.join(__dirname, '../collection.json')
  );

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('generating helper for a platform where the helper is not supported should not do anything', () => {
    const optionsXplat: XPlatOptions = {
      npmScope: 'testing',
      prefix: 'tt',
      platforms: 'web,nativescript'
    };

    appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const options: HelperOptions = {
      name: 'imports',
      platforms: 'web'
    };
    // console.log('appTree:', appTree);
    const tree = schematicRunner.runSchematic('helpers', options, appTree);
    const files = tree.files;
    // console.log(files);

    // xplat helpers
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/core.ts')
    ).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/utils/@nativescript/ui.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/xplat/nativescript/utils/@nativescript/angular/core.ts')
    ).toBe(-1);
  });
});
