import { Tree } from '@angular-devkit/schematics';
import {
  getFileContent,
  createXplatWithNativeScriptWeb
} from '@nstudio/xplat/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';
import { ComponentHelpers } from '../../utils/xplat';

describe('component schematic', () => {
  let appTree: Tree;
  const defaultOptions: ComponentHelpers.Schema = {
    name: 'signup',
    feature: 'foo',
    platforms: 'nativescript,web',
    createBase: true
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree);
  });

  it('should create component for specified platforms', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web'
      },
      appTree
    );
    const options: ComponentHelpers.Schema = { ...defaultOptions };
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf('/libs/features/foo/base/signup.base-component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/signup/signup.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/signup/signup.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/web/features/foo/components/signup/signup.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/web/features/foo/components/signup/signup.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // ensure base index was modified
    let barrelPath = '/libs/features/foo/base/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(
      barrelIndex.indexOf(`./signup.base-component`)
    ).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath = '/xplat/nativescript/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(
      0
    );
    expect(
      barrelIndex.indexOf(`./signup/signup.component`)
    ).toBeGreaterThanOrEqual(0);

    barrelPath = '/xplat/web/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(
      0
    );
  });

  it('should create component for specified platforms with subFolder option', async () => {
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'feature',
      {
        name: 'foo',
        platforms: 'nativescript,web'
      },
      appTree
    );
    const options: ComponentHelpers.Schema = { ...defaultOptions };
    options.subFolder = 'registration';
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf(
        '/libs/features/foo/base/registration/signup.base-component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/registration/signup/signup.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/registration/signup/signup.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/web/features/foo/components/registration/signup/signup.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/web/features/foo/components/registration/signup/signup.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // ensure base index was modified
    let barrelPath = '/libs/features/foo/base/registration/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(
      barrelIndex.indexOf(`./signup.base-component`)
    ).toBeGreaterThanOrEqual(0);

    barrelPath = '/libs/features/foo/base/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`./registration`)).toBeGreaterThanOrEqual(0);

    // file content
    barrelPath =
      '/xplat/nativescript/features/foo/components/registration/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(
      0
    );
    expect(
      barrelIndex.indexOf(`./signup/signup.component`)
    ).toBeGreaterThanOrEqual(0);

    barrelPath = '/xplat/web/features/foo/components/registration/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(
      0
    );

    // file content
    barrelPath = '/xplat/nativescript/features/foo/components/index.ts';
    barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(
      barrelIndex.indexOf(`REGISTRATION_COMPONENTS`)
    ).toBeGreaterThanOrEqual(0);

    barrelPath = '/xplat/web/features/foo/components/index.ts';
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
        onlyProject: true
      },
      appTree
    );
    const options: ComponentHelpers.Schema = {
      name: 'signup',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer'
    };
    tree = await runSchematic('component', options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // component should not be setup to share
    expect(
      files.indexOf('/libs/features/foo/base/signup.base-component.ts')
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/signup/signup.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/signup/signup.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/web/features/foo/components/signup/signup.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/web/features/foo/components/signup/signup.component.ts'
      )
    ).toBe(-1);

    // component should be project specific
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/signup/signup.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/signup/signup.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/signup/signup.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/signup/signup.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let barrelPath =
      '/apps/nativescript-viewer/src/features/foo/components/index.ts';
    let barrelIndex = getFileContent(tree, barrelPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(
      0
    );
    expect(
      barrelIndex.indexOf(`./signup/signup.component`)
    ).toBeGreaterThanOrEqual(0);

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
    expect(barrelIndex.indexOf(`SignupComponent\n];`)).toBeGreaterThanOrEqual(
      0
    );
  });

  it('should THROW if feature module does not exist in projects', async () => {
    // console.log('appTree:', appTree);
    const options: ComponentHelpers.Schema = {
      name: 'signup',
      feature: 'foo',
      projects: 'nativescript-viewer,web-viewer'
    };

    expect(() => runSchematicSync('component', options, appTree)).toThrowError(
      `apps/nativescript-viewer/src/features/foo/foo.module.ts does not exist. Create the feature module first. For example: ng g feature foo --projects=nativescript-viewer --onlyModule`
    );
  });
});
