import {
  chain,
  externalSchematic,
  SchematicContext,
  Tree,
  noop
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatIonicAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/web-angular',
        'xplat',
        {
          ...options
        },
        { interactive: false }
      ),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/ionic',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true
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
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatIonicAngularHelpers.updateRootDeps(options)
  ]);
}
