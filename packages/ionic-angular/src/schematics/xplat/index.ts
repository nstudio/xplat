import {
  chain,
  externalSchematic,
  SchematicContext,
  Tree,
  noop,
} from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '@nstudio/angular';
import { XplatIonicAngularHelpers } from '../../utils/xplat';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/ionic',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true,
        },
        { interactive: false }
      ),
    XplatAngularHelpers.generateLib(options, 'core', 'xplat/ionic', 'node'),
    XplatAngularHelpers.cleanupLib(options, 'core', 'xplat/ionic'),
    XplatAngularHelpers.generateLib(options, 'features', 'xplat/ionic', 'node'),
    XplatAngularHelpers.cleanupLib(options, 'features', 'xplat/ionic'),
    XplatAngularHelpers.generateLib(options, 'scss', 'xplat/ionic', 'node'),
    XplatAngularHelpers.cleanupLib(options, 'scss', 'xplat/ionic'),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'ionic',
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
        'ionic',
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
        'ionic',
        'angular'
      );
      // console.log('xplatName:', xplatName);
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
    XplatIonicAngularHelpers.updateRootDeps(options),
  ]);
}
