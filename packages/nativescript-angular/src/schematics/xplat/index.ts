import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop,
} from '@angular-devkit/schematics';
import { updateTsConfig, XplatHelpers } from '@nstudio/xplat';
import { getNpmScope, prerun } from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '@nstudio/angular';
import { XplatNativeScriptAngularHelpers } from '../../utils/xplat';
import { XplatNativeScriptHelpers } from '@nstudio/nativescript';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    XplatNativeScriptHelpers.addReferences(),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/nativescript',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true,
        },
        { interactive: false }
      ),
    XplatHelpers.generateLib(options, 'core', 'xplat/nativescript', 'node'),
    XplatHelpers.cleanupLib(options, 'core', 'xplat/nativescript'),
    XplatHelpers.generateLib(options, 'features', 'xplat/nativescript', 'node'),
    XplatHelpers.cleanupLib(options, 'features', 'xplat/nativescript'),
    XplatHelpers.generateLib(options, 'scss', 'xplat/nativescript', 'node'),
    XplatHelpers.cleanupLib(options, 'scss', 'xplat/nativescript'),
    XplatHelpers.generateLib(options, 'utils', 'xplat/nativescript', 'node'),
    XplatHelpers.cleanupLib(options, 'utils', 'xplat/nativescript'),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
        'angular'
      );
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(
            options,
            xplatFolderName,
            'core',
            'index.ts'
          )(tree, context);
    },
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
        'angular'
      );
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(
            options,
            xplatFolderName,
            'features',
            'index.ts'
          )(tree, context);
    },

    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
        'angular'
      );
      // console.log('xplatName:', xplatName);
      // console.log('options:', options);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(
            options,
            xplatFolderName,
            'utils',
            'index.ts'
          )(tree, context);
    },
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
        'angular'
      );
      // console.log('xplatName:', xplatName);
      // console.log('options:', options);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(
            options,
            xplatFolderName,
            'scss',
            '_common.scss'
          )(tree, context);
    },
    // TODO: convert these @nstudio/angular api's to singular external schematics so could be called with externalSchematic api

    XplatHelpers.generateLib(options, 'core', 'xplat', 'node'),
    XplatHelpers.cleanupLib(options, 'core', 'xplat'),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'core'
    ),
    XplatHelpers.generateLib(options, 'features', 'xplat', 'node'),
    XplatHelpers.cleanupLib(options, 'features', 'xplat'),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'features'
    ),
    XplatHelpers.generateLib(options, 'scss', 'xplat', 'jsdom'),
    XplatHelpers.cleanupLib(options, 'scss', 'xplat'),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'scss'
    ),
    XplatHelpers.generateLib(options, 'utils', 'xplat', 'node'),
    XplatHelpers.cleanupLib(options, 'utils', 'xplat'),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'utils'
    ),
    XplatNativeScriptAngularHelpers.updateRootDeps(options),
    // adjust root tsconfig
    (tree: Tree, context: SchematicContext) => {
      return updateTsConfig(tree, (tsConfig: any) => {
        if (tsConfig) {
          if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
          }

          if (!tsConfig.compilerOptions.paths[`@${getNpmScope()}/xplat/core`]) {
            tsConfig.compilerOptions.paths[`@${getNpmScope()}/xplat/core`] = [
              `libs/xplat/core/src/index.ts`,
            ];
          }
          if (
            !tsConfig.compilerOptions.paths[
              `@${getNpmScope()}/xplat/environments`
            ]
          ) {
            tsConfig.compilerOptions.paths[
              `@${getNpmScope()}/xplat/environments`
            ] = [`libs/xplat/core/src/lib/environments/base/index.ts`];
          }
          if (
            !tsConfig.compilerOptions.paths[`@${getNpmScope()}/xplat/features`]
          ) {
            tsConfig.compilerOptions.paths[
              `@${getNpmScope()}/xplat/features`
            ] = [`libs/xplat/features/src/index.ts`];
          }
          if (
            !tsConfig.compilerOptions.paths[`@${getNpmScope()}/xplat/utils`]
          ) {
            tsConfig.compilerOptions.paths[`@${getNpmScope()}/xplat/utils`] = [
              `libs/xplat/utils/src/index.ts`,
            ];
          }
        }
      });
    },
  ]);
}
