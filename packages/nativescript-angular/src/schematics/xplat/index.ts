import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatNativeScriptAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
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
    XplatHelpers.addPlatformFiles(options, 'nativescript-angular'),
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatNativeScriptAngularHelpers.updateRootDeps(options)
  ]);
}
