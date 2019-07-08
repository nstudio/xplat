import { Tree } from '@angular-devkit/schematics';
import { runSchematic, callRule } from '../../utils/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { readJsonInTree, updateJsonInTree } from '@nrwl/workspace';

describe('ng-add', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should add angular dependencies', async () => {
    const tree = await runSchematic('ng-add', {}, appTree);
    const { dependencies, devDependencies } = readJsonInTree(
      tree,
      'package.json'
    );
    expect(dependencies['@angular/animations']).toBeDefined();
    expect(dependencies['@angular/common']).toBeDefined();
    expect(dependencies['@angular/compiler']).toBeDefined();
    expect(dependencies['@angular/core']).toBeDefined();
    expect(dependencies['@angular/platform-browser']).toBeDefined();
    expect(dependencies['@angular/platform-browser-dynamic']).toBeDefined();
    expect(dependencies['@angular/router']).toBeDefined();
    expect(dependencies['core-js']).toBeDefined();
    expect(dependencies['rxjs']).toBeDefined();
    expect(dependencies['zone.js']).toBeDefined();
    expect(devDependencies['@angular/compiler-cli']).toBeDefined();
    expect(devDependencies['@angular/language-service']).toBeDefined();
    expect(devDependencies['@angular-devkit/build-angular']).toBeDefined();
    expect(devDependencies['codelyzer']).toBeDefined();
  });

  describe('defaultCollection', () => {
    it('should be set if none was set before', async () => {
      const result = await runSchematic('ng-add', {}, appTree);
      const angularJson = readJsonInTree(result, 'angular.json');
      expect(angularJson.cli.defaultCollection).toEqual('@nstudio/angular');
    });

    it('should be set if @nrwl/workspace was set before', async () => {
      appTree = await callRule(
        updateJsonInTree('angular.json', json => {
          json.cli = {
            defaultCollection: '@nrwl/workspace'
          };

          return json;
        }),
        appTree
      );
      const result = await runSchematic('ng-add', {}, appTree);
      const angularJson = readJsonInTree(result, 'angular.json');
      expect(angularJson.cli.defaultCollection).toEqual('@nstudio/angular');
    });

    it('should be set if @nstudio/workspace was set before', async () => {
      appTree = await callRule(
        updateJsonInTree('angular.json', json => {
          json.cli = {
            defaultCollection: '@nstudio/workspace'
          };

          return json;
        }),
        appTree
      );
      const result = await runSchematic('ng-add', {}, appTree);
      const angularJson = readJsonInTree(result, 'angular.json');
      expect(angularJson.cli.defaultCollection).toEqual('@nstudio/angular');
    });

    it('should not be set if something else was set before', async () => {
      appTree = await callRule(
        updateJsonInTree('angular.json', json => {
          json.cli = {
            defaultCollection: '@nstudio/nativescript'
          };

          return json;
        }),
        appTree
      );
      const result = await runSchematic('ng-add', {}, appTree);
      const angularJson = readJsonInTree(result, 'angular.json');
      expect(angularJson.cli.defaultCollection).toEqual('@nstudio/nativescript');
    });
  });
});
