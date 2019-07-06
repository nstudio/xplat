import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';

import {
  getJsonFromFile,
  updateJsonFile,
  createOrUpdate,
  updateJsonInTree
} from '@nstudio/workspace';

export default function(): Rule {
  return chain([updateRootPackage]);
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.dependencies = {
      ...json.dependencies,
      'nativescript-angular': '~7.1.0',
      'tns-core-modules': '~5.1.0'
    };
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      'tns-platform-declarations': '~5.1.0'
    };

    return json;
  })(tree, context);
}
