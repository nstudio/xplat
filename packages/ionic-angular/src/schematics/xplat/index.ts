import {
  chain,
  externalSchematic,
  SchematicContext,
  Tree,
  noop,
} from '@angular-devkit/schematics';
import { XplatHelpers, convertNgTreeToDevKit } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '@nstudio/angular';
import { XplatIonicAngularHelpers } from '../../utils/xplat';
import { initGenerator } from '@nx/js';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    async (tree, context) => {
      const nxTree = convertNgTreeToDevKit(tree, context);
      await initGenerator(nxTree, { skipFormat: true });
    },
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
    XplatHelpers.generateLib(options, 'core', 'xplat/ionic', 'node'),
    XplatHelpers.cleanupLib(options, 'core', 'xplat/ionic'),
    XplatHelpers.generateLib(options, 'features', 'xplat/ionic', 'node'),
    XplatHelpers.cleanupLib(options, 'features', 'xplat/ionic'),
    XplatHelpers.generateLib(options, 'scss', 'xplat/ionic', 'node'),
    XplatHelpers.cleanupLib(options, 'scss', 'xplat/ionic'),
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
            'core',
            'index.ts'
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
            'features',
            'index.ts'
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
            'scss',
            '_index.scss'
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
