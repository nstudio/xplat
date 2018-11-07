import {
  Rule,
  Tree,
  chain,
  // SchematicContext,
} from '@angular-devkit/schematics';
// import { InsertChange } from '@schematics/angular/utility/change';

import { Schema as ConfigOptions } from './schema';
import {
  getNxWorkspaceConfig,
  supportedPlatforms,
  defaultPlatforms,
  updateTsConfig,
} from '../utils';

export default function ( options: ConfigOptions ): Rule {
  return chain( [
    updatePaths(options),
    // updateSpecExcludes()
  ] );
};

function updatePaths(options: ConfigOptions) {
  return ( tree: Tree ) => {
    const nxJson = getNxWorkspaceConfig( tree );
    const npmScope = nxJson.npmScope;
    const platformArg = options.platforms || defaultPlatforms;
    // sort for consistency
    const platforms = platformArg.split( ',' ).sort( function ( a, b ) {
      if ( a < b ) return -1;
      if ( a > b ) return 1;
      return 0;
    } );
    if ((platforms.includes('ionic') || platforms.includes('electron')) && !platforms.includes('web')) {
      // ensure web is added since these platforms depend on it
      platforms.push('web');
    }
    const updates: any = {};
    // ensure default Nx libs path is in place
    updates[`@${npmScope}/*`] = [
      `libs/*`
    ];
    for ( const t of platforms ) {
      if ( supportedPlatforms.includes( t ) ) {
        updates[`@${npmScope}/${t}`] = [
          `xplat/${t}/index.ts`
        ];
        updates[`@${npmScope}/${t}/*`] = [
          `xplat/${t}/*`
        ];
      } else {
        throw new Error( `${t} is not a supported platform. Currently supported: ${supportedPlatforms}` );
      }
    }

    return updateTsConfig(tree, (tsConfig: any) => {
      if (tsConfig) {
        if (!tsConfig.compilerOptions) {
          tsConfig.compilerOptions = {};
        }
        tsConfig.compilerOptions.paths = { ...(tsConfig.compilerOptions.paths || {}), ...updates };
      }
    });
  }
}

// function updateSpecExcludes() {
//   return ( tree: Tree ) => {
//     return updateTsConfig(tree, (tsConfig: any) => {
//       if (tsConfig) {
//         if (!tsConfig.exclude) {
//           tsConfig.exclude = [];
//         }
//         tsConfig.exclude.push('apps/nativescript-*');
//       }
//     }, 'spec');
//   }
// }