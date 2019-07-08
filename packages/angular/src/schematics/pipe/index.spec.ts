import { Tree } from '@angular-devkit/schematics';
import { Schema as GenerateOptions } from './schema';
import { createXplatWithApps, getFileContent } from '@nstudio/workspace/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';

describe('pipe schematic', () => {
  let appTree: Tree;
  const defaultOptions: GenerateOptions = {
    name: 'truncate'
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithApps(appTree);
  });

  it('should create pipe in libs by default for use across any platform and apps', async () => {
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
    let options: GenerateOptions = { ...defaultOptions };
    tree = await runSchematic('pipe', options, tree);
    let files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf('/libs/features/ui/pipes/truncate.pipe.ts')
    ).toBeGreaterThanOrEqual(0);

    // file content
    let content = getFileContent(
      tree,
      '/libs/features/ui/pipes/truncate.pipe.ts'
    );
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'truncate'`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/libs/features/ui/ui.module.ts';
    let moduleContent = getFileContent(tree, modulePath);

    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...UI_PIPES`)).toBeGreaterThanOrEqual(0);

    options = { ...defaultOptions, feature: 'foo' };
    tree = await runSchematic('pipe', options, tree);
    files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf('/libs/features/foo/pipes/truncate.pipe.ts')
    ).toBeGreaterThanOrEqual(0);

    // file content
    content = getFileContent(tree, '/libs/features/foo/pipes/truncate.pipe.ts');
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'truncate'`)).toBeGreaterThanOrEqual(0);

    modulePath = '/libs/features/foo/foo.module.ts';
    moduleContent = getFileContent(tree, modulePath);

    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PIPES`)).toBeGreaterThanOrEqual(0);
  });

  it('should create pipe in libs and handle camel case properly', async () => {
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
    let options: GenerateOptions = {
      ...defaultOptions,
      name: 'test-with-dashes'
    };
    tree = await runSchematic('pipe', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf('/libs/features/ui/pipes/test-with-dashes.pipe.ts')
    ).toBeGreaterThanOrEqual(0);

    // file content
    let content = getFileContent(
      tree,
      '/libs/features/ui/pipes/test-with-dashes.pipe.ts'
    );
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'testWithDashes'`)).toBeGreaterThanOrEqual(0);
  });

  it('should THROW if feature module does not exist in libs', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'xplat',
      {
        prefix: 'tt',
        platforms: 'web'
      },
      appTree
    );
    const options: GenerateOptions = { ...defaultOptions };
    options.feature = 'register';
    expect(
      () => (tree = runSchematicSync('pipe', options, tree))
    ).toThrowError(
      `libs/features/register/register.module.ts does not exist. Create the feature module first. For example: ng g feature register`
    );
  });

  it('should create pipe for specified projects only', async () => {
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
      name: 'truncate',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer'
    };
    tree = await runSchematic('pipe', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // pipe should not be setup to share
    expect(files.indexOf('/libs/features/ui/pipes/truncate.pipe.ts')).toBe(-1);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/pipes/truncate.pipe.ts')
    ).toBe(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/pipes/truncate.pipe.ts')
    ).toBe(-1);

    // pipe should be project specific
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo/pipes/truncate.pipe.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/pipes/truncate.pipe.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let pipeIndexPath =
      '/apps/nativescript-viewer/app/features/foo/pipes/index.ts';
    let pipeIndex = getFileContent(tree, pipeIndexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(pipeIndex.indexOf(`TruncatePipe`)).toBeGreaterThanOrEqual(0);

    let modulePath = '/apps/nativescript-viewer/app/features/foo/foo.module.ts';
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
    let tree = await runSchematic(
      'xplat',
      {
        prefix: 'tt',
        platforms: 'nativescript,web'
      },
      appTree
    );
    const options: GenerateOptions = {
      name: 'truncate',
      feature: 'register',
      platforms: 'nativescript,web'
    };

    expect(
      () => (tree = runSchematicSync('pipe', options, tree))
    ).toThrowError(
      `xplat/nativescript/features/register/register.module.ts does not exist. Create the feature module first. For example: ng g feature register --platforms=nativescript --onlyModule`
    );
  });

  it('should THROW if feature module does not exist in projects', async () => {
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
      name: 'truncate',
      feature: 'register',
      projects: 'nativescript-viewer,web-viewer'
    };

    expect(
      () => (tree = runSchematicSync('pipe', options, tree))
    ).toThrowError(
      `apps/nativescript-viewer/app/features/register/register.module.ts does not exist. Create the feature module first. For example: ng g feature register --projects=nativescript-viewer --onlyModule`
    );
  });
});
