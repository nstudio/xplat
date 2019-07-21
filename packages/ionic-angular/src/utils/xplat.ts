import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope, IXplatSettings } from '@nstudio/xplat';
import { ionicAngularVersion, ionicAngularToolkitVersion } from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      const xplatFoldername = XplatHelpers.getXplatFoldername('web', 'angular');
      dependencies[`@${getNpmScope()}/web-scss`] = `file:xplat/${xplatFoldername}/scss`;
      return XplatHelpers.updatePackageForXplat(
        options,
        {
          dependencies: {
            ...dependencies,
            '@ionic/angular': ionicAngularVersion
          },
          devDependencies: {
            '@ionic/angular-toolkit': ionicAngularToolkitVersion
          }
        }
      )(tree, context);
    };
  }
}
