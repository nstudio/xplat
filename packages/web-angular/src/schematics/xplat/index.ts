import {
  chain,
  externalSchematic,
  noop,
  Tree,
  SchematicContext
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatWebAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(options, xplatFolderName)(
            tree,
            context
          );
    },
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatWebAngularHelpers.updateRootDeps(options)
  ]);
}
