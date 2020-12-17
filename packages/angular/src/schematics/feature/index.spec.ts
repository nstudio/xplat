import { Tree } from '@angular-devkit/schematics';
import { createOrUpdate } from '@nrwl/workspace';
import { XplatFeatureHelpers } from '@nstudio/xplat';
import {
  isInModuleMetadata,
  getFileContent,
  createXplatWithNativeScriptWeb,
} from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';

describe('feature schematic', () => {
  let appTree: Tree;
  const defaultOptions: XplatFeatureHelpers.Schema = {
    name: 'foo',
    projects: 'nativescript-viewer,web-viewer',
    createBase: true,
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree, null, 'angular');
  });

  it('should create feature module with a single starting component', async () => {
    const options: XplatFeatureHelpers.Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = await runSchematic('feature', options, appTree);
    const files = tree.files;
    console.log(files.slice(85,files.length));
    expect(
      files.indexOf('/apps/nativescript-viewer/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/xplat/features/src/lib/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript/core/src/lib/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/xplat/web/core/src/lib/index.ts')).toBeGreaterThanOrEqual(0);

    // feature in shared code
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/xplat/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/features/src/lib/foo/base/foo.base-component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.html')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.ts')
    ).toBeGreaterThanOrEqual(0);

    // feature should NOT be in projects
    expect(
      files.indexOf('/apps/nativescript-viewer/src/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/nativescript-viewer/src/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(-1);

    // file content
    let modulePath = '/libs/xplat/nativescript/features/src/lib/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );

    modulePath = '/libs/xplat/web/features/src/lib/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );
  });

  it('should create feature module with a single starting component with framework suffix for xplat when no default is set', async () => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree);
    const options: XplatFeatureHelpers.Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = await runSchematic('feature', options, appTree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(
      files.indexOf('/apps/nativescript-viewer/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/xplat/features/src/lib/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript-angular/core/src/lib/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/xplat/web-angular/core/src/lib/index.ts')).toBeGreaterThanOrEqual(
      0
    );

    // feature in shared code
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/xplat/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/features/src/lib/foo/base/foo.base-component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript-angular/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript-angular/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript-angular/features/src/lib/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript-angular/features/src/lib/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web-angular/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web-angular/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/web-angular/features/src/lib/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/web-angular/features/src/lib/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // feature should NOT be in projects
    expect(
      files.indexOf('/apps/nativescript-viewer/src/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/nativescript-viewer/src/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(-1);

    // file content
    let modulePath = '/libs/xplat/nativescript-angular/features/src/lib/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );

    modulePath = '/libs/xplat/web-angular/features/src/lib/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );
  });

  it('should create feature module WITHOUT a single starting component when using onlyModule', async () => {
    // console.log('appTree:', appTree);
    const options: XplatFeatureHelpers.Schema = { ...defaultOptions };
    options.onlyModule = true;
    let tree = await runSchematic('feature', options, appTree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(
      files.indexOf('/apps/nativescript-viewer/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/xplat/features/src/lib/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript/core/src/lib/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/xplat/web/core/src/lib/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/xplat/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/base/foo.base-component.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.html')
    ).toBe(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.ts')
    ).toBe(-1);

    // file content
    let modulePath = '/libs/xplat/nativescript/features/src/lib/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );
    expect(featureModule.indexOf('FOO_COMPONENTS')).toBe(-1);
    expect(featureModule.indexOf('declarations')).toBe(-1);

    modulePath = '/libs/xplat/nativescript/features/src/lib/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );
  });

  it('should create feature module WITH a single starting component BUT IGNORE creating matching base component', async () => {
    // console.log('appTree:', appTree);
    const options: XplatFeatureHelpers.Schema = {
      name: 'foo',
      platforms: 'web',
    };
    let tree = await runSchematic('feature', options, appTree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // shared code defaults
    expect(files.indexOf('/libs/xplat/features/src/lib/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/nativescript/core/src/lib/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/xplat/web/core/src/lib/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/xplat/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/base/foo.base-component.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/libs/xplat/nativescript/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/libs/xplat/nativescript/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/foo/components/foo/foo.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.html')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.ts')
    ).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath = '/libs/xplat/web/features/src/lib/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );
    expect(featureModule.indexOf('FOO_COMPONENTS')).toBeGreaterThanOrEqual(0);
    expect(featureModule.indexOf('declarations')).toBeGreaterThanOrEqual(0);

    let compPath = '/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.ts';
    let compContent = getFileContent(tree, compPath);
    // console.log(compPath + ':');
    // console.log(compContent);
    expect(compContent.indexOf('extends BaseComponent')).toBeGreaterThanOrEqual(
      0
    );
  });

  it('should create feature module for specified projects only', async () => {
    const options: XplatFeatureHelpers.Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    options.onlyProject = true;
    let tree = await runSchematic('feature', options, appTree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // feature should not be in shared code
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/foo.module.ts')).toBe(-1);
    expect(files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/xplat/web/features/src/lib/foo/index.ts')).toBe(-1);

    // feature should be in projects only
    expect(
      files.indexOf('/apps/nativescript-viewer/src/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-viewer/src/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // NOT in shared code
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/xplat/features/src/lib/foo/base/foo.base-component.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/libs/xplat/nativescript/features/src/lib/foo/components/foo/foo.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.html')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/libs/xplat/web/features/src/lib/foo/components/foo/foo.component.ts')
    ).toBeGreaterThanOrEqual(-1);

    // file content
    let modulePath = '/apps/nativescript-viewer/src/features/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `SharedModule`, true)
    );
    expect(featureModule).toMatch(
      `import { SharedModule } from \'../shared/shared.module\'`
    );

    modulePath = '/apps/web-viewer/src/app/features/foo/foo.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `SharedModule`, true)
    );
    expect(featureModule).toMatch(
      `import { SharedModule } from \'../shared/shared.module\'`
    );
  });

  it('Temporary: should error if routing is used without onlyProject', async () => {
    const options: XplatFeatureHelpers.Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    options.routing = true;
    await expect(() =>
      runSchematic('feature', options, appTree)
    ).rejects.toThrow(
      'When generating a feature with the --routing option, please also specify --onlyProject. Support for shared code routing is under development.'
    );
  });

  it('should create feature module (with dashes in name) for specified projects WITH Routing', async () => {
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree, true);
    const options: XplatFeatureHelpers.Schema = { ...defaultOptions };
    // console.log('appTree:', appTree);
    options.onlyProject = true;
    options.routing = true;
    options.name = 'foo-with-dash';
    let tree = await runSchematic('feature', options, appTree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // feature should not be in shared code
    expect(files.indexOf('/libs/xplat/features/src/lib/foo-with-dash/index.ts')).toBe(-1);
    expect(
      files.indexOf('/libs/xplat/nativescript/features/src/lib/foo-with-dash/index.ts')
    ).toBe(-1);
    expect(files.indexOf('/libs/xplat/web/features/src/lib/foo-with-dash/index.ts')).toBe(
      -1
    );

    // feature should be in projects only
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo-with-dash/index.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo-with-dash/foo-with-dash.module.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/src/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/foo-with-dash/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo-with-dash/foo-with-dash.module.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/web-viewer/src/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath =
      '/apps/nativescript-viewer/src/features/foo-with-dash/foo-with-dash.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      `import { NativeScriptRouterModule } from \'@nativescript/angular\'`
    );
    expect(featureModule).toMatch(`component: FooWithDashComponent`);
    // expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `SharedModule`, true));
    expect(featureModule).toMatch(`NativeScriptRouterModule.forChild`);

    modulePath =
      '/apps/web-viewer/src/app/features/foo-with-dash/foo-with-dash.module.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      `import { RouterModule, Routes } from \'@angular/router\'`
    );
    expect(featureModule).toMatch(`component: FooWithDashComponent`);
    // expect(featureModule).toMatch(isInModuleMetadata('FooModule', 'imports', `SharedModule`, true));
    expect(featureModule).toMatch(`RouterModule.forChild`);

    // check if there was a root app.routing.ts module modified
    modulePath = '/apps/web-viewer/src/app/app.routing.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      `import { RouterModule, Routes } from \'@angular/router\'`
    );
    expect(featureModule).toMatch(`loadChildren: () =>`);
    expect(featureModule).toMatch(
      `'./features/foo-with-dash/foo-with-dash.module'`
    );

    modulePath = '/apps/nativescript-viewer/src/app.routing.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`loadChildren: () =>`);
    expect(featureModule).toMatch(
      `'./features/foo-with-dash/foo-with-dash.module'`
    );

    // check that name with dash was handled right
    modulePath =
      '/apps/web-viewer/src/app/features/foo-with-dash/components/index.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(`export const FOOWITHDASH_COMPONENTS`);
  });

  it('should create feature module for specified project WITH Routing and adjustSandbox', async () => {
    const options: XplatFeatureHelpers.Schema = {
      ...defaultOptions,
      projects: 'nativescript-viewer',
    };
    appTree = Tree.empty();
    appTree = createXplatWithNativeScriptWeb(appTree, true);

    // manually update home.component to prep for sandobx
    const homeCmpPath = `/apps/nativescript-viewer/src/features/home/components/home.component.html`;
    createOrUpdate(appTree, homeCmpPath, sandboxHomeSetup());
    // console.log('homecmp:', getFileContent(tree, homeCmpPath));

    options.onlyProject = true;
    options.adjustSandbox = true;
    options.routing = true;
    options.name = 'foo-with-dash';
    let tree = await runSchematic('feature', options, appTree);
    // console.log('---------')
    // console.log('homecmp:', getFileContent(tree, homeCmpPath));
  });
});

export function sandboxHomeSetup() {
  return `<ActionBar title="Sandbox" class="action-bar">
</ActionBar>
<StackLayout>
  <ScrollView>
    <StackLayout class="p-20">
      <Button text="Buttons" (tap)="goTo('/page-buttons')" class="btn"></Button>
    </StackLayout>
  </ScrollView>
</StackLayout>  
`;
}
