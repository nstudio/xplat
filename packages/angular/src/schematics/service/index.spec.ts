import { Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';
import { createXplatWithApps, getFileContent, createXplatWithNativeScriptWeb } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('service schematic', () => {
  let appTree: Tree;
  const defaultOptions: Schema = {
    name: 'auth'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree);
  });

  it('should create service in libs by default for use across any platform and apps', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web'
      },
      appTree
    );
    const options: Schema = { ...defaultOptions };
    tree = await runSchematic('service', options, tree);
    // console.log(files.slice(91,files.length));

    expect(
      tree.exists('/libs/core/services/auth.service.ts')
    ).toBeTruthy();

    // file content
    let content = getFileContent(tree, '/libs/core/services/auth.service.ts');
    // console.log(content);
    expect(content.indexOf(`@Injectable()`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    content = getFileContent(tree, '/libs/core/services/index.ts');
    // console.log(content);
    expect(content.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/libs/core/core.module.ts';
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...CORE_PROVIDERS`)).toBeGreaterThanOrEqual(
      0
    );
  });

  it('should create service for specified projects only', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        projects: 'nativescript-viewer,web-viewer',
        onlyProject: true
      },
      appTree
    );
    const options: Schema = {
      name: 'auth',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer'
    };
    tree = await runSchematic('service', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // service should not be setup to share
    expect(files.indexOf('/libs/features/foo/services/auth.service.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/xplat/nativescript/features/foo/services/auth.service.ts')
    ).toBe(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/services/auth.service.ts')
    ).toBe(-1);

    // service should be project specific
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/services/auth.service.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/services/auth.service.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let indexPath =
      '/apps/nativescript-viewer/src/features/foo/services/index.ts';
    let index = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // symbol should be at end of components collection
    expect(index.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/apps/nativescript-viewer/src/features/foo/foo.module.ts';
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PROVIDERS`)).toBeGreaterThanOrEqual(0);

    indexPath = '/apps/web-viewer/src/app/features/foo/services/index.ts';
    index = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(index.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);
  });

  it('should create service for specified platform with targeted feature only', async () => {
    // console.log('appTree:', appTree);
    
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript'
      },
      appTree
    );
    const options: Schema = {
      name: 'auth',
      feature: 'foo',
      platforms: 'nativescript'
    };
    tree = await runSchematic('service', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    expect(
      files.indexOf('/xplat/nativescript/features/foo/services/auth.service.ts')
    ).toBeGreaterThanOrEqual(0);
    // should NOT add for other platform
    expect(
      files.indexOf('/xplat/web/features/foo/services/auth.service.ts')
    ).toBe(-1);

    // file content
    let content = getFileContent(
      tree,
      '/xplat/nativescript/features/foo/services/auth.service.ts'
    );
    // console.log(content);
    expect(content.indexOf(`@Injectable()`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    content = getFileContent(
      tree,
      '/xplat/nativescript/features/foo/services/index.ts'
    );
    // console.log(content);
    expect(content.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PROVIDERS`)).toBeGreaterThanOrEqual(0);
  });

  it('should create service for specified platform only and by default add to core for that platform', async () => {
    // console.log('appTree:', appTree);
    const options: Schema = {
      name: 'auth',
      platforms: 'nativescript'
    };
    let tree = await runSchematic('service', options, appTree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    expect(
      files.indexOf('/xplat/nativescript/core/services/auth.service.ts')
    ).toBeGreaterThanOrEqual(0);
    // should NOT add for other platform
    expect(files.indexOf('/xplat/web/core/services/auth.service.ts')).toBe(-1);

    // file content
    let content = getFileContent(
      tree,
      '/xplat/nativescript/core/services/auth.service.ts'
    );
    // console.log(content);
    expect(content.indexOf(`@Injectable()`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    content = getFileContent(
      tree,
      '/xplat/nativescript/core/services/index.ts'
    );
    // console.log(content);
    expect(content.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/xplat/nativescript/core/core.module.ts';
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...CORE_PROVIDERS`)).toBeGreaterThanOrEqual(
      0
    );
  });
});
