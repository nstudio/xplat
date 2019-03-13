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
    name: 'ui',
    barrel: '@mycompany/web',
    components: 'MenuComponent,FooterComponent'
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
      platforms: 'web',
      ignoreBase: true
    };
    tree = schematicRunner.runSchematic('component', componentOptions, tree);
    componentOptions.name = 'footer';
    tree = schematicRunner.runSchematic('component', componentOptions, tree);
    const files = tree.files;
    // console.log(files.slice(85,files.length));
    expect(files.indexOf('/xplat/web/features/ui/components/menu/menu.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/menu/menu.component.ts')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/footer/footer.component.html')).toBeGreaterThanOrEqual(0);
    expect(files.indexOf('/xplat/web/features/ui/components/footer/footer.component.ts')).toBeGreaterThanOrEqual(0);
  });

});