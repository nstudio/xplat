import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope } from '@nstudio/xplat';
import { ionicAngularVersion, ionicAngularToolkitVersion } from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      dependencies[`@${getNpmScope()}/web`] = 'file:xplat/web';
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies,
          '@ionic/angular': ionicAngularVersion,
        },
        devDependencies: {
          '@ionic/angular-toolkit': ionicAngularToolkitVersion
        }
      })(tree, context);
    };
  }
}

