import { Tree, VirtualTree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { getFileContent } from '@schematics/angular/utility/test';
import * as path from 'path';

import { Schema as ElementsOptions } from './schema';
import { Schema as ComponentOptions } from '../component/schema';
import { createXplatWithApps, isInModuleMetadata, createOrUpdate, createEmptyWorkspace } from '../utils';

describe('elements schematic', () => {
  const schematicRunner = new SchematicTestRunner(
    '@nstudio/schematics',
    path.join(__dirname, '../collection.json'),
  );
  const defaultOptions: ElementsOptions = {
    name: 'ui-kit',
    barrel: '@mycompany/web',
    components: 'menu,footer'
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  it('should create an elements module that provides the specified components', () => {
    const options: ElementsOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      platforms: 'web'
    }, appTree);
    const componentOptions: ComponentOptions = { 
      name: 'menu',
      platforms: 'web'
    };
    tree = schematicRunner.runSchematic('component', componentOptions, tree);
    componentOptions.name = 'footer';
    tree = schematicRunner.runSchematic('component', componentOptions, tree);
    let files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(files.indexOf('/xplat/web/features/ui/components/menu/menu.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/menu/menu.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/footer/footer.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/footer/footer.component.ts')).toBeGreaterThanOrEqual(0);

    tree = schematicRunner.runSchematic('elements', options, tree);
    files = tree.files;

    const elementModulePath = '/xplat/web/elements/ui-kit.module.ts';
    expect(files.indexOf(elementModulePath)).toBeGreaterThanOrEqual(0);
    const elementModule = getFileContent(tree, elementModulePath);
    // console.log(elementModule);
    expect(elementModule.indexOf(`import { MenuComponent, FooterComponent } from '@mycompany/web';`)).toBeGreaterThanOrEqual(0);
    expect(elementModule.indexOf(`createCustomElement(MenuComponent`)).toBeGreaterThanOrEqual(0);
    expect(elementModule.indexOf(`define('tt-menu'`)).toBeGreaterThanOrEqual(0);
    expect(elementModule.indexOf(`createCustomElement(FooterComponent`)).toBeGreaterThanOrEqual(0);
    expect(elementModule.indexOf(`define('tt-footer'`)).toBeGreaterThanOrEqual(0);

    const packageFile = getFileContent(tree, 'package.json');
    // console.log(elementModule);
    expect(packageFile.indexOf(`build.web.elements`)).toBeGreaterThanOrEqual(0);
    expect(packageFile.indexOf(`preview.web.elements`)).toBeGreaterThanOrEqual(0);
  });

  it('--builderModule argument', () => {
    const options: ElementsOptions = { ...defaultOptions };
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic('xplat', {
      prefix: 'tt',
      platforms: 'web'
    }, appTree);
    const componentOptions: ComponentOptions = { 
      name: 'menu',
      platforms: 'web'
    };
    tree = schematicRunner.runSchematic('component', componentOptions, tree);
    componentOptions.name = 'footer';
    tree = schematicRunner.runSchematic('component', componentOptions, tree);
    let files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(files.indexOf('/xplat/web/features/ui/components/menu/menu.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/menu/menu.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/footer/footer.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/footer/footer.component.ts')).toBeGreaterThanOrEqual(0);

    tree = schematicRunner.runSchematic('elements', options, tree);
    files = tree.files;

    let elementModulePath = '/xplat/web/elements/ui-kit.module.ts';
    expect(files.indexOf(elementModulePath)).toBeGreaterThanOrEqual(0);
    let elementModule = getFileContent(tree, elementModulePath);
    // console.log(elementModule);
    expect(elementModule.indexOf(`import { MenuComponent, FooterComponent } from '@mycompany/web';`)).toBeGreaterThanOrEqual(0);

    let builderPath = '/xplat/web/elements/builder/elements.ts';
    expect(files.indexOf(builderPath)).toBeGreaterThanOrEqual(0);
    let builderModule = getFileContent(tree, builderPath);
    // console.log(builderModule);
    expect(builderModule.indexOf(`../ui-kit.module`)).toBeGreaterThanOrEqual(0);
    let builderIndexPath = '/xplat/web/elements/builder/index.html';
    expect(files.indexOf(builderPath)).toBeGreaterThanOrEqual(0);
    let builderIndex = getFileContent(tree, builderIndexPath);
    // console.log(builderIndex);
    expect(builderIndex.indexOf(`<tt-menu></tt-menu>`)).toBeGreaterThanOrEqual(0);
    expect(builderIndex.indexOf(`<tt-footer></tt-footer>`)).toBeGreaterThanOrEqual(0);
    
    const component2Options: ComponentOptions = { 
      name: 'dropdown',
      platforms: 'web'
    };
    tree = schematicRunner.runSchematic('component', component2Options, tree);
    component2Options.name = 'link';
    tree = schematicRunner.runSchematic('component', component2Options, tree);
    files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(files.indexOf('/xplat/web/features/ui/components/dropdown/dropdown.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/dropdown/dropdown.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/link/link.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/link/link.component.ts')).toBeGreaterThanOrEqual(0);

    const newElementOptions: ElementsOptions = {
      name: 'widgets',
      barrel: '@mycompany/web',
      components: 'dropdown,link'
    };
    tree = schematicRunner.runSchematic('elements', newElementOptions, tree);
    files = tree.files;

    elementModulePath = '/xplat/web/elements/widgets.module.ts';
    expect(files.indexOf(elementModulePath)).toBeGreaterThanOrEqual(0);
    elementModule = getFileContent(tree, elementModulePath);
    // console.log(elementModule);
    expect(elementModule.indexOf(`import { DropdownComponent, LinkComponent } from '@mycompany/web';`)).toBeGreaterThanOrEqual(0);

    builderModule = getFileContent(tree, builderPath);
    // console.log(builderModule);
    expect(builderModule.indexOf(`../widgets.module`)).toBeGreaterThanOrEqual(0);
    builderIndex = getFileContent(tree, builderIndexPath);
    // console.log(builderIndex);
    expect(builderIndex.indexOf(`<tt-dropdown></tt-dropdown>`)).toBeGreaterThanOrEqual(0);
    expect(builderIndex.indexOf(`<tt-link></tt-link>`)).toBeGreaterThanOrEqual(0);

    const builderOption: ElementsOptions = {
      builderModule: 'ui-kit',
    };
    tree = schematicRunner.runSchematic('elements', builderOption, tree);
    files = tree.files;
    builderModule = getFileContent(tree, builderPath);
    // console.log(builderModule);
    expect(builderModule.indexOf(`../ui-kit.module`)).toBeGreaterThanOrEqual(0);
    builderIndex = getFileContent(tree, builderIndexPath);
    // console.log(builderIndex);
    expect(builderIndex.indexOf(`<tt-menu></tt-menu>`)).toBeGreaterThanOrEqual(0);
    expect(builderIndex.indexOf(`<tt-footer></tt-footer>`)).toBeGreaterThanOrEqual(0);

  });

});