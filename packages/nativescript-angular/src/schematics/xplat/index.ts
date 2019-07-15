import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatNativeScriptAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    XplatNativeScriptAngularHelpers.addReferences(),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/nativescript',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true
        },
        { interactive: false }
      ),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
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
    XplatNativeScriptAngularHelpers.updateRootDeps(options)
  ]);
}
