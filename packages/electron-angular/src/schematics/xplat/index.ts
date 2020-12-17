import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop,
} from '@angular-devkit/schematics';
import { XplatAngularHelpers } from '@nstudio/angular';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { XplatHelpers } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatElectronAngularHelpers } from '../../utils';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) => {
      if (
        tree.exists(`/libs/xplat/web-angular/scss/src/_variables.scss`)
      ) {
        return noop();
      } else {
        return externalSchematic('@nstudio/web-angular', 'xplat', options, {
          interactive: false,
        })(tree, context);
      }
    },
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/electron',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true,
        },
        { interactive: false }
      ),
    XplatHelpers.generateLib(options, 'core', 'xplat/electron', 'node'),
    XplatHelpers.cleanupLib(options, 'core', 'xplat/electron'),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'electron',
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
    XplatElectronAngularHelpers.updateRootDeps(options),
  ]);
}
