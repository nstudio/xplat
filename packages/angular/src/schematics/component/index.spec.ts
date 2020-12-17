import { Tree } from '@angular-devkit/schematics';
import {
  getFileContent,
  createXplatWithNativeScriptWeb,
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
import { XplatComponentHelpers } from '@nstudio/xplat';

describe('component schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatComponentHelpers.Schema = {
    name: 'signup',
    feature: 'foo',
    platforms: 'nativescript,web',
    createBase: true,
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree, false, 'angular');
  });

  it('should create component for specified platforms', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web',
      },
      appTree
    );
    const options: XplatComponentHelpers.Schema = { ...defaultOptions };
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      tree.exists('/libs/xplat/features/src/lib/foo/base/signup.base-component.ts')
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript/features/src/lib/foo/components/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript/features/src/lib/foo/components/signup/signup.component.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/web/features/src/lib/foo/components/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/web/features/src/lib/foo/components/signup/signup.component.ts'
      )
    ).toBeTruthy();

    // ensure base index was modified
    let barrelPath = '/libs/xplat/features/src/lib/foo/base/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(
      barrelIndex.indexOf(`./signup.base-component`)
    ).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath = '/libs/xplat/nativescript/features/src/lib/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent];`)).toBeGreaterThanOrEqual(0);
    expect(
      barrelIndex.indexOf(`./signup/signup.component`)
    ).toBeGreaterThanOrEqual(0);

    barrelPath = '/libs/xplat/web/features/src/lib/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent];`)).toBeGreaterThanOrEqual(0);
  });

  it('should create component for specified platforms with framework name when no default is set', async () => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree);
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web',
      },
      appTree
    );
    const options: XplatComponentHelpers.Schema = { ...defaultOptions };
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files);//.slice(91,files.length));

    // component
    expect(
      tree.exists('/libs/xplat/features/src/lib/foo/base/signup.base-component.ts')
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript-angular/features/src/lib/foo/components/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript-angular/features/src/lib/foo/components/signup/signup.component.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/web-angular/features/src/lib/foo/components/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/web-angular/features/src/lib/foo/components/signup/signup.component.ts'
      )
    ).toBeTruthy();
  });

  it('should create component for specified platforms with subFolder option', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web',
      },
      appTree
    );
    const options: XplatComponentHelpers.Schema = { ...defaultOptions };
    options.subFolder = 'registration';
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      tree.exists(
        '/libs/xplat/features/src/lib/foo/base/registration/signup.base-component.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript/features/src/lib/foo/components/registration/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript/features/src/lib/foo/components/registration/signup/signup.component.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/web/features/src/lib/foo/components/registration/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/libs/xplat/web/features/src/lib/foo/components/registration/signup/signup.component.ts'
      )
    ).toBeTruthy();

    // ensure base index was modified
    let barrelPath = '/libs/xplat/features/src/lib/foo/base/registration/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`./signup.base-component`)).toBeTruthy();

    barrelPath = '/libs/xplat/features/src/lib/foo/base/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`./registration`)).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath =
      '/libs/xplat/nativescript/features/src/lib/foo/components/registration/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent];`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/libs/xplat/web/features/src/lib/foo/components/registration/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(
      barrelIndex.indexOf(`./signup/signup.component`)
    ).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath = '/libs/xplat/nativescript/features/src/lib/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(
      barrelIndex.indexOf(`REGISTRATION_COMPONENTS`)
    ).toBeGreaterThanOrEqual(0);

    barrelPath = '/libs/xplat/web/features/src/lib/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(
      barrelIndex.indexOf(`REGISTRATION_COMPONENTS`)
    ).toBeGreaterThanOrEqual(0);
  });

  it('should create component for specified projects only', async () => {
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
    const options: XplatComponentHelpers.Schema = {
      name: 'signup',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer',
    };
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // component should not be setup to share
    expect(
      tree.exists('/libs/xplat/features/src/lib/foo/base/signup.base-component.ts')
    ).toBeFalsy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript/features/src/lib/foo/components/signup/signup.component.html'
      )
    ).toBeFalsy();
    expect(
      tree.exists(
        '/libs/xplat/nativescript/features/src/lib/foo/components/signup/signup.component.ts'
      )
    ).toBeFalsy();
    expect(
      tree.exists(
        '/libs/xplat/web/features/src/lib/foo/components/signup/signup.component.html'
      )
    ).toBeFalsy();
    expect(
      tree.exists(
        '/libs/xplat/web/features/src/lib/foo/components/signup/signup.component.ts'
      )
    ).toBeFalsy();

    // component should be project specific
    expect(
      tree.exists(
        '/apps/nativescript-viewer/src/features/foo/components/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/nativescript-viewer/src/features/foo/components/signup/signup.component.ts'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/web-viewer/src/app/features/foo/components/signup/signup.component.html'
      )
    ).toBeTruthy();
    expect(
      tree.exists(
        '/apps/web-viewer/src/app/features/foo/components/signup/signup.component.ts'
      )
    ).toBeTruthy();

    // file content
    let barrelPath =
      '/apps/nativescript-viewer/src/features/foo/components/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent];`)).toBeGreaterThanOrEqual(0);

    // let modulePath = '/apps/nativescript-viewer/src/features/foo/foo.module.ts';
    // let content = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(content);
    // // component symbol should be at end of components collection
    // expect(content.indexOf(`./signup/signup.component.ts`)).toBeGreaterThanOrEqual(0);

    barrelPath = '/apps/web-viewer/src/app/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent];`)).toBeGreaterThanOrEqual(0);
  });

  it('should THROW if feature module does not exist in projects', async () => {
    // console.log('appTree:', appTree);
    const options: XplatComponentHelpers.Schema = {
      name: 'signup',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer',
    };

    await expect(runSchematic('component', options, appTree)).rejects.toThrow(
      `apps/nativescript-viewer/src/features/foo/foo.module.ts does not exist. Create the feature module first. For example: nx g @nstudio/angular:feature foo --projects=nativescript-viewer --onlyModule`
    );
  });
});
