import {
  chain,
  Tree,
} from '@angular-devkit/schematics';

import { IDevMode, updateIDESettings, supportedPlatforms, updateTsConfig } from '../utils';
import { Schema as xPlatOptions } from './schema';

let name: IDevMode;
export default function (options: xPlatOptions) {
  if (!options.name) {
    name = 'fullstack';
    console.warn(`Using 'fullstack' since no mode was specified. Currently supported: fullstack,${supportedPlatforms}. Example: ng g mode nativescript`);
  } else {
    name = options.name;
  }

  return chain([
    // update tsconfig based on mode
    (tree: Tree) => updateExcludes(name)(tree),
    // update IDE settings
    (tree: Tree) => updateIDESettings(tree, name, name) // targets and mode should be the same
  ]);
}

function updateExcludes(devMode: IDevMode) {
  return ( tree: Tree ) => {
    return updateTsConfig(tree, (tsConfig: any) => {
      if (tsConfig) {
        if (!tsConfig.exclude) {
          tsConfig.exclude = [];
        }
        const tnsRefs = 'references.d.ts';
        if (devMode === 'nativescript' || devMode === 'fullstack') {
          const index = tsConfig.exclude.findIndex(entry => entry === tnsRefs);
          if (index > -1) {
            tsConfig.exclude.splice(index, 1);
          }
        } else {
          // when not doing {N} development, alleviate pressue on TS resolution
          if (!tsConfig.exclude.includes(tnsRefs)) {
            tsConfig.exclude.push('references.d.ts');
          }
        }
      }
    });
  }
}