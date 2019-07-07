import { Tree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
import { Schema as GenerateOptions } from './schema';
import { createXplatWithApps } from '@nstudio/workspace/testing';
import { runSchematic } from '../../utils/testing';

describe('service schematic', () => {
  let appTree: Tree;
  const defaultOptions: GenerateOptions = {
    name: 'auth'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithApps(appTree);
  });

  it('should create service in libs by default for use across any platform and apps', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript,web'
      },
      appTree
    );
    tree = await runSchematic(
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt'
      },
      tree
    );
    tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web'
      },
      tree
    );
    const options: GenerateOptions = { ...defaultOptions };
    tree = await runSchematic('service', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    expect(
      files.indexOf('/libs/core/services/auth.service.ts')
    ).toBeGreaterThanOrEqual(0);

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
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript,web'
      },
      appTree
    );
    tree = await runSchematic(
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt'
      },
      tree
    );
    tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        projects: 'nativescript-viewer,web-viewer',
        onlyProject: true
      },
      tree
    );
    const options: GenerateOptions = {
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
        '/apps/nativescript-viewer/app/features/foo/services/auth.service.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/services/auth.service.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let indexPath =
      '/apps/nativescript-viewer/app/features/foo/services/index.ts';
    let index = getFileContent(tree, indexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // symbol should be at end of components collection
    expect(index.indexOf(`AuthService`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/apps/nativescript-viewer/app/features/foo/foo.module.ts';
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
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript'
      },
      appTree
    );
    tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript'
      },
      tree
    );
    const options: GenerateOptions = {
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
    let tree = await runSchematic(
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript,web'
      },
      appTree
    );
    const options: GenerateOptions = {
      name: 'auth',
      platforms: 'nativescript'
    };
    tree = await runSchematic('service', options, tree);
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
