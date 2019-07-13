import {
  chain,
  externalSchematic,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatIonicAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
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
    XplatHelpers.addPlatformFiles(options, 'ionic-angular'),
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatIonicAngularHelpers.updateRootDeps(options)
  ]);
}
