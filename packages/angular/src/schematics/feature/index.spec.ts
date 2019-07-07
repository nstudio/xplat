import { Tree } from '@angular-devkit/schematics';
import { getFileContent } from '@schematics/angular/utility/test';
import { Schema as FeatureOptions } from './schema';
import { createOrUpdate } from '@nstudio/workspace';
import {
  createXplatWithApps,
  isInModuleMetadata
} from '@nstudio/workspace/testing';
import { runSchematic, runSchematicSync } from '../../utils/testing';

describe('feature schematic', () => {
  let appTree: Tree;
  const defaultOptions: FeatureOptions = {
    name: 'foo',
    projects: 'nativescript-viewer,web-viewer',
    createBase: true
  };

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithApps(appTree);
  });

  it('should create feature module with a single starting component', async () => {
    const options: FeatureOptions = { ...defaultOptions };
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
    tree = await runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(
      files.indexOf('/apps/nativescript-viewer/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/features/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);

    // feature in shared code
    expect(files.indexOf('/libs/features/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/libs/features/foo/base/foo.base-component.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')
    ).toBeGreaterThanOrEqual(0);

    // feature should NOT be in projects
    expect(
      files.indexOf('/apps/nativescript-viewer/app/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/apps/nativescript-viewer/app/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo/components/foo/foo.component.ts'
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
    let modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      isInModuleMetadata('FooModule', 'imports', `UIModule`, true)
    );
    expect(featureModule).toMatch(
      `import { UIModule } from \'../ui/ui.module\'`
    );

    modulePath = '/xplat/web/features/foo/foo.module.ts';
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
    const options: FeatureOptions = { ...defaultOptions };
    options.onlyModule = true;
    tree = await runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(
      files.indexOf('/apps/nativescript-viewer/package.json')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-viewer/src/app/features/core/core.module.ts')
    ).toBeGreaterThanOrEqual(0);

    // shared code defaults
    expect(files.indexOf('/libs/features/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/features/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/features/foo/base/foo.base-component.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/xplat/nativescript/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')
    ).toBe(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')
    ).toBe(-1);

    // file content
    let modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
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

    modulePath = '/xplat/nativescript/features/foo/foo.module.ts';
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
    const options: FeatureOptions = {
      name: 'foo',
      platforms: 'web'
    };
    tree = await runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // shared code defaults
    expect(files.indexOf('/libs/features/index.ts')).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/nativescript/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/index.ts')).toBeGreaterThanOrEqual(0);

    // feature
    expect(files.indexOf('/libs/features/foo/index.ts')).toBeGreaterThanOrEqual(
      0
    );
    expect(
      files.indexOf('/libs/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/libs/features/foo/base/foo.base-component.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/xplat/nativescript/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')
    ).toBeGreaterThanOrEqual(0);

    // file content
    let modulePath = '/xplat/web/features/foo/foo.module.ts';
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

    let compPath = '/xplat/web/features/foo/components/foo/foo.component.ts';
    let compContent = getFileContent(tree, compPath);
    // console.log(compPath + ':');
    // console.log(compContent);
    expect(compContent.indexOf('extends BaseComponent')).toBeGreaterThanOrEqual(
      0
    );
  });

  it('should create feature module for specified projects only', async () => {
    const options: FeatureOptions = { ...defaultOptions };
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
    options.onlyProject = true;
    tree = await runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // feature should not be in shared code
    expect(files.indexOf('/libs/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/features/foo/foo.module.ts')).toBe(-1);
    expect(files.indexOf('/xplat/nativescript/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo/index.ts')).toBe(-1);

    // feature should be in projects only
    expect(
      files.indexOf('/apps/nativescript-viewer/app/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/nativescript-viewer/app/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo/components/foo/foo.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo/components/foo/foo.component.ts'
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
    expect(files.indexOf('/libs/features/foo/index.ts')).toBe(-1);
    expect(files.indexOf('/libs/features/foo/base/foo.base-component.ts')).toBe(
      -1
    );
    expect(
      files.indexOf('/xplat/nativescript/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/xplat/nativescript/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.html'
      )
    ).toBe(-1);
    expect(
      files.indexOf(
        '/xplat/nativescript/features/foo/components/foo/foo.component.ts'
      )
    ).toBe(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/index.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/foo.module.ts')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.html')
    ).toBeGreaterThanOrEqual(-1);
    expect(
      files.indexOf('/xplat/web/features/foo/components/foo/foo.component.ts')
    ).toBeGreaterThanOrEqual(-1);

    // file content
    let modulePath = '/apps/nativescript-viewer/app/features/foo/foo.module.ts';
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
    const options: FeatureOptions = { ...defaultOptions };
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
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt'
      },
      tree
    );
    options.routing = true;
    expect(
      () => (tree = runSchematicSync('feature', options, tree))
    ).toThrowError(
      'When generating a feature with the --routing option, please also specify --onlyProject. Support for shared code routing is under development and will be available in the future.'
    );
  });

  it('should create feature module (with dashes in name) for specified projects WITH Routing', async () => {
    const options: FeatureOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = await runSchematic(
      'xplat',
      {
        prefix: 'tt',
        routing: true,
        platforms: 'nativescript,web'
      },
      appTree
    );
    tree = await runSchematic(
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt',
        routing: true
      },
      tree
    );
    options.onlyProject = true;
    options.routing = true;
    options.name = 'foo-with-dash';
    tree = await runSchematic('feature', options, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));

    // feature should not be in shared code
    expect(files.indexOf('/libs/features/foo-with-dash/index.ts')).toBe(-1);
    expect(
      files.indexOf('/xplat/nativescript/features/foo-with-dash/index.ts')
    ).toBe(-1);
    expect(files.indexOf('/xplat/web/features/foo-with-dash/index.ts')).toBe(
      -1
    );

    // feature should be in projects only
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo-with-dash/index.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo-with-dash/foo-with-dash.module.ts'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.html'
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        '/apps/nativescript-viewer/app/features/foo-with-dash/components/foo-with-dash/foo-with-dash.component.ts'
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
      '/apps/nativescript-viewer/app/features/foo-with-dash/foo-with-dash.module.ts';
    let featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      `import { NativeScriptRouterModule } from \'nativescript-angular/router\'`
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
    expect(featureModule).toMatch(
      `loadChildren: './features/home/home.module#HomeModule'`
    );
    expect(featureModule).toMatch(
      `loadChildren: './features/foo-with-dash/foo-with-dash.module#FooWithDashModule'`
    );

    modulePath = '/apps/nativescript-viewer/app/app.routing.ts';
    featureModule = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(featureModule);
    expect(featureModule).toMatch(
      `loadChildren: '~/features/home/home.module#HomeModule'`
    );
    expect(featureModule).toMatch(
      `loadChildren: '~/features/foo-with-dash/foo-with-dash.module#FooWithDashModule'`
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
    const options: FeatureOptions = {
      ...defaultOptions,
      projects: 'nativescript-viewer'
    };
    let tree = await runSchematic(
      'xplat',
      {
        prefix: 'tt',
        routing: true,
        platforms: 'nativescript'
      },
      appTree
    );
    tree = await runSchematic(
      'app.nativescript',
      {
        name: 'viewer',
        prefix: 'tt',
        routing: true
      },
      tree
    );

    // manually update home.component to prep for sandobx
    const homeCmpPath = `/apps/nativescript-viewer/app/features/home/components/home.component.html`;
    createOrUpdate(tree, homeCmpPath, sandboxHomeSetup());
    // console.log('homecmp:', getFileContent(tree, homeCmpPath));

    options.onlyProject = true;
    options.adjustSandbox = true;
    options.routing = true;
    options.name = 'foo-with-dash';
    tree = await runSchematic('feature', options, tree);
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
