import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop,
} from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
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
            'core'
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
            'features'
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
            'utils'
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
            'scss'
          )(tree, context);
    },
    // TODO: convert these @nstudio/angular api's to singular external schematics so could be called with externalSchematic api
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'core'
    ),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'features'
    ),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'scss'
    ),
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`,
      'utils'
    ),
    XplatNativeScriptAngularHelpers.updateRootDeps(options),
  ]);
}
