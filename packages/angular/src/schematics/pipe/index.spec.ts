import { Tree, externalSchematic } from '@angular-devkit/schematics';
import { Schema as GenerateOptions } from './schema';
import {
  createXplatWithApps,
  getFileContent,
  createXplatWithNativeScriptWeb,
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

describe('pipe schematic', () => {
  let appTree: Tree;
  const defaultOptions: GenerateOptions = {
    name: 'truncate',
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree, null, 'angular');
  });

  it('should create pipe in libs by default for use across any platform and apps', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web',
      },
      appTree
    );
    let options: GenerateOptions = { ...defaultOptions };
    tree = await runSchematic('pipe', options, tree);
    // let files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      tree.exists('/libs/xplat/features/src/lib/ui/pipes/truncate.pipe.ts')
    ).toBeTruthy();

    // file content
    let content = getFileContent(
      tree,
      '/libs/xplat/features/src/lib/ui/pipes/truncate.pipe.ts'
    );
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'truncate'`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/libs/xplat/features/src/lib/ui/ui.module.ts';
    let moduleContent = getFileContent(tree, modulePath);

    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...UI_PIPES`)).toBeGreaterThanOrEqual(0);

    options = { ...defaultOptions, feature: 'foo' };
    tree = await runSchematic('pipe', options, tree);
    // files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      tree.exists('/libs/xplat/features/src/lib/foo/pipes/truncate.pipe.ts')
    ).toBeTruthy();

    // file content
    content = getFileContent(tree, '/libs/xplat/features/src/lib/foo/pipes/truncate.pipe.ts');
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'truncate'`)).toBeGreaterThanOrEqual(0);

    modulePath = '/libs/xplat/features/src/lib/foo/foo.module.ts';
    moduleContent = getFileContent(tree, modulePath);

    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PIPES`)).toBeGreaterThanOrEqual(0);
  });

  it('should create pipe in libs and handle camel case properly', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web',
      },
      appTree
    );
    let options: GenerateOptions = {
      ...defaultOptions,
      name: 'test-with-dashes',
    };
    tree = await runSchematic('pipe', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      tree.exists('/libs/xplat/features/src/lib/ui/pipes/test-with-dashes.pipe.ts')
    ).toBeTruthy();

    // file content
    let content = getFileContent(
      tree,
      '/libs/xplat/features/src/lib/ui/pipes/test-with-dashes.pipe.ts'
    );
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'testWithDashes'`)).toBeGreaterThanOrEqual(0);
  });

  it('should THROW if feature module does not exist in libs', async () => {
    // console.log('appTree:', appTree);
    let tree;
    const options: GenerateOptions = { ...defaultOptions };
    options.feature = 'register';
    await expect(runSchematic('pipe', options, appTree)).rejects.toThrow(
      `libs/xplat/features/src/lib/register/register.module.ts does not exist. Create the feature module first. For example: nx g @nstudio/angular:feature register`
    );
  });

  it('should create pipe for specified projects only', async () => {
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
      name: 'truncate',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer',
    };
    tree = await runSchematic('pipe', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // pipe should not be setup to share
    expect(tree.exists('/libs/xplat/features/src/lib/ui/pipes/truncate.pipe.ts')).toBeFalsy();
    expect(
      tree.exists('/libs/xplat/nativescript/features/src/lib/foo/pipes/truncate.pipe.ts')
    ).toBeFalsy();
    expect(
      tree.exists('/libs/xplat/web/features/src/lib/foo/pipes/truncate.pipe.ts')
    ).toBeFalsy();

    // pipe should be project specific
    expect(
      tree.exists(
        '/apps/nativescript-viewer/src/features/foo/pipes/truncate.pipe.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/web-viewer/src/app/features/foo/pipes/truncate.pipe.ts'
      )
    ).toBeTruthy();

    // file content
    let pipeIndexPath =
      '/apps/nativescript-viewer/src/features/foo/pipes/index.ts';
    let pipeIndex = getFileContent(tree, pipeIndexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(pipeIndex.indexOf(`TruncatePipe`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/apps/nativescript-viewer/src/features/foo/foo.module.ts';
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PIPES`)).toBeGreaterThanOrEqual(0);

    pipeIndexPath = '/apps/web-viewer/src/app/features/foo/pipes/index.ts';
    pipeIndex = getFileContent(tree, pipeIndexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(pipeIndex.indexOf(`TruncatePipe`)).toBeGreaterThanOrEqual(0);

    modulePath = '/apps/web-viewer/src/app/features/foo/foo.module.ts';
    moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PIPES`)).toBeGreaterThanOrEqual(0);
  });

  it('should THROW if feature module does not exist in shared code', async () => {
    // console.log('appTree:', appTree);
    let tree;
    const options: GenerateOptions = {
      name: 'truncate',
      feature: 'register',
      platforms: 'nativescript,web',
    };

    await expect(runSchematic('pipe', options, appTree)).rejects.toThrow(
      `libs/xplat/nativescript/features/src/lib/register/register.module.ts does not exist. Create the feature module first. For example: nx g @nstudio/angular:feature register --platforms=nativescript --onlyModule`
    );
  });

  it('should THROW if feature module does not exist in projects', async () => {
    // console.log('appTree:', appTree);
    let tree;
    const options: GenerateOptions = {
      name: 'truncate',
      feature: 'register',
      projects: 'nativescript-viewer,web-viewer',
    };

    await expect(runSchematic('pipe', options, appTree)).rejects.toThrow(
      `apps/nativescript-viewer/src/features/register/register.module.ts does not exist. Create the feature module first. For example: nx g @nstudio/angular:feature register --projects=nativescript-viewer --onlyModule`
    );
  });
});
