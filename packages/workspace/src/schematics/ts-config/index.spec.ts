import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { createEmptyWorkspace } from '@nstudio/workspace/testing';
import { Schema as ConfigOptions } from './schema';

describe('ts-config schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/workspace',
    path.join(__dirname, '../collection.json')
  );
  const defaultOptions: ConfigOptions = {};

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should modify root tsconfig for web,nativescript', () => {
    const options: ConfigOptions = { ...defaultOptions };

    const tree = schematicRunner.runSchematic('ts-config', options, appTree);
    const tsConfig = getFileContent(tree, 'tsconfig.json');
    expect(tsConfig.indexOf(`@testing/nativescript`)).toBe(95);
    expect(tsConfig.indexOf(`xplat/nativescript/index.ts`)).toBe(130);
    expect(tsConfig.indexOf(`@testing/web`)).toBe(250);
    expect(tsConfig.indexOf(`xplat/web/index.ts`)).toBe(276);
  });
});
