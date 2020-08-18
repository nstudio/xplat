import { Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import { XplatHelpers, IXplatSettings } from '@nstudio/xplat';
import { xplatVersion, nxVersion } from './versions';

export namespace XplatElectronAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      return XplatHelpers.updatePackageForXplat(options, {
        // nothing extra needed at moment
        devDependencies: {
          '@nrwl/angular': nxVersion,
          '@nstudio/angular': xplatVersion,
        },
      })(tree, context);
    };
  }
}
