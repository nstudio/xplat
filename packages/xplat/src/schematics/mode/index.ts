import { chain, Tree, SchematicContext } from '@angular-devkit/schematics';

import {
  PlatformTypes,
  supportedPlatforms,
  updateTsConfig,
  prerun,
  getGroupByName,
  XplatHelpers
} from '@nstudio/xplat';
import { Schema as xPlatOptions } from './schema';
import { PlatformModes } from '../../utils';

let name: PlatformModes;
export default function(options: xPlatOptions) {
  if (!options.name) {
    name = 'fullstack';
    console.warn(
      `Using 'fullstack' since no mode was specified. Currently supported: fullstack,${supportedPlatforms}. Example: ng g mode nativescript`
    );
  } else {
    name = options.name;
  }

  return chain([
    // init xplat settings
    prerun(),
    // update tsconfig based on mode
    (tree: Tree) => updateExcludes(name)(tree),
    // update IDE settings
    (tree: Tree, context: SchematicContext) => {
      const appsDir = tree.getDir('apps');
      const appFolders = appsDir.subdirs;
      const allApps = [];
      for (const dir of appFolders) {
        allApps.push(`**${appsDir.path}/${dir}`);
      }

      // project handling
      let focusOnApps: string[] = [];
      if (name !== 'fullstack' && options.projects) {
        focusOnApps = options.projects.split(',');
        for (let i = 0; i < focusOnApps.length; i++) {
          const projectName = focusOnApps[i];
          const nameParts = <Array<PlatformTypes>>(<unknown>projectName.split('-'));
          let containsPlatform = false;
          for (const n of nameParts) {
            if (supportedPlatforms.includes(n)) {
              containsPlatform = true;
            }
          }
          if (!containsPlatform) {
            // allows for shorthand project/app names omitting platform
            // just add platform to the name
            const appName = getGroupByName()
              ? `${nameParts.join('-')}-${name}`
              : `${name}-${nameParts.join('-')}`;
            focusOnApps[i] = `**/apps/${appName}`;
          }
        }
      }
      // targets and mode should be the same
      return XplatHelpers.updateIDESettings({
        platforms: name
      }, name, allApps, focusOnApps)(tree, context);
    }
  ]);
}

function updateExcludes(devMode: PlatformModes) {
  return (tree: Tree) => {
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
  };
}
