import { Tree } from '@angular-devkit/schematics';
import { Schema as GenerateOptions } from './schema';
import {
  createXplatWithApps,
  getFileContent,
  createXplatWithNativeScriptWeb,
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('ngrx schematic', () => {
  let appTree: Tree;
  const defaultOptions: GenerateOptions = {
    name: 'auth',
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree, null, 'angular');
  });

  it('should create root state in libs for use across any platform and apps', async () => {
    // console.log('appTree:', appTree);

    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web',
      },
      appTree
    );
    const options: GenerateOptions = { ...defaultOptions };
    options.root = true;
    tree = await runSchematic('ngrx', options, tree);
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
    expect(content.indexOf(`[@testing/auth] init'`)).toBeGreaterThanOrEqual(0);

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

  it('should create ngrx state for specified projects only', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        projects: 'nativescript-viewer,web-viewer',
        onlyProject: true,
      },
      appTree
    );
    const options: GenerateOptions = {
      name: 'auth',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer',
    };
    tree = await runSchematic('ngrx', options, tree);
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
        '/apps/nativescript-viewer/src/features/foo/state/auth.actions.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/state/auth.actions.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let indexPath =
      '/apps/nativescript-viewer/src/features/foo/state/auth.actions.ts';
    let content = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // symbol should be at end of collection
    expect(content.indexOf(`AuthActions`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/apps/nativescript-viewer/src/features/foo/foo.module.ts';
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
    // console.log('content:', content)
    expect(content.indexOf(`StoreModule.forFeature`)).toBeGreaterThanOrEqual(0);
  });
});
