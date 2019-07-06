import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as GenerateOptions } from './schema';
import { createXplatWithApps } from '@nstudio/workspace/testing';

describe('ngrx schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json')
  );
  const defaultOptions: GenerateOptions = {
    name: 'auth'
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithApps(appTree);
  });

  it('should create root state in libs for use across any platform and apps', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript,web'
      },
      appTree
    );
    tree = schematicRunner.runSchematic(
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt'
      },
      tree
    );
    tree = schematicRunner.runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web'
      },
      tree
    );
    const options: GenerateOptions = { ...defaultOptions };
    options.root = true;
    tree = schematicRunner.runSchematic('ngrx', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    expect(
      files.indexOf('/libs/core/state/auth.actions.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/core/state/auth.effects.spec.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/core/state/auth.effects.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/core/state/auth.reducer.spec.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/core/state/auth.reducer.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/core/state/auth.state.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/core/state/index.ts')).toBeGreaterThanOrEqual(
      0
    );

    // file content
    let content = getFileContent(tree, '/libs/core/state/auth.actions.ts');
    // console.log(content);
    expect(content.indexOf(`AuthActions`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`[@testing/auth] Init'`)).toBeGreaterThanOrEqual(0);

    content = getFileContent(tree, '/libs/core/index.ts');
    // console.log('/libs/core/index.ts:', content);
    expect(content.indexOf(`export * from './state';`)).toBeGreaterThanOrEqual(
      0
    );

    let modulePath = '/libs/core/core.module.ts';
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`StoreModule.forRoot`)).toBeGreaterThanOrEqual(
      0
    );
  });

  it('should create ngrx state for specified projects only', () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript,web,ionic'
      },
      appTree
    );
    tree = schematicRunner.runSchematic(
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt'
      },
      tree
    );
    tree = schematicRunner.runSchematic(
      'feature',
      {
        name: 'foo',
        projects: 'nativescript-viewer,web-viewer,ionic-viewer',
        onlyProject: true
      },
      tree
    );
    const options: GenerateOptions = {
      name: 'auth',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer,ionic-viewer'
    };
    tree = schematicRunner.runSchematic('ngrx', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // state should not be setup to share
    expect(files.indexOf('/libs/core/state/auth.actions.ts')).toBe(-1);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/state/auth.actions.ts')
    ).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/state/auth.actions.ts')).toBe(
      -1
    );

    // state should be project specific
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo/state/auth.actions.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/state/auth.actions.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/ionic-viewer/src/app/features/foo/state/auth.actions.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let indexPath =
      '/apps/nativescript-viewer/app/features/foo/state/auth.actions.ts';
    let content = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // symbol should be at end of collection
    expect(content.indexOf(`AuthActions`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/apps/nativescript-viewer/app/features/foo/foo.module.ts';
    content = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(content);
    // symbol should be at end of collection
    expect(content.indexOf(`StoreModule.forFeature`)).toBeGreaterThanOrEqual(0);

    indexPath = '/apps/web-viewer/src/app/features/foo/state/auth.actions.ts';
    content = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(content.indexOf(`AuthActions`)).toBeGreaterThanOrEqual(0);
    modulePath = '/apps/web-viewer/src/app/features/foo/foo.module.ts';
    content = getFileContent(tree, modulePath);
    expect(content.indexOf(`StoreModule.forFeature`)).toBeGreaterThanOrEqual(0);

    indexPath = '/apps/ionic-viewer/src/app/features/foo/state/auth.actions.ts';
    content = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(content.indexOf(`AuthActions`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`AuthActions`)).toBeGreaterThanOrEqual(0);
    modulePath = '/apps/ionic-viewer/src/app/features/foo/foo.module.ts';
    content = getFileContent(tree, modulePath);
    expect(content.indexOf(`StoreModule.forFeature`)).toBeGreaterThanOrEqual(0);
  });
});
