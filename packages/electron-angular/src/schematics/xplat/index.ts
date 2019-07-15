import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatElectronAngularHelpers } from '../../utils';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/web-angular', 'xplat', options, {
        interactive: false
      }),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/electron',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true
        },
        { interactive: false }
      ),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'electron',
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
    XplatElectronAngularHelpers.updateRootDeps(options)
  ]);
}
