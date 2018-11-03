import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

import { Schema as ApplicationOptions } from './schema';
import { createEmptyWorkspace } from '../utils';

describe('app.electron schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: ApplicationOptions = {
    name: 'foo',
    npmScope: 'testing',
    prefix: 'tt',
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create all files of an app', () => {
    const options: ApplicationOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    const tree = schematicRunner.runSchematic('app.electron', options, appTree);
    const files = tree.files;
    // console.log(files);
    expect(files.indexOf('/apps/electron-foo/src/main.ts')).toBeGreaterThanOrEqual(0);
  });
});
