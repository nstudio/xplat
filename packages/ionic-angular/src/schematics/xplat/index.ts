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
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'ionic',
        'angular'
      );
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(options, xplatFolderName)(
            tree,
            context
          );
    },
    // TODO: convert these @nstudio/angular api's to singular external schematics so could be called with externalSchematic api
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`
    ),
    XplatAngularHelpers.addScssFiles(
      options,
      `../../../../angular/src/schematics/xplat/`
    ),
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatIonicAngularHelpers.updateRootDeps(options),
  ]);
}
