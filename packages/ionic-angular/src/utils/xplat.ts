import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope, IXplatSettings } from '@nstudio/xplat';
import { ionicAngularVersion, ionicAngularToolkitVersion } from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const xplatSettings: IXplatSettings = {};
      const frameworkChoice = XplatHelpers.getFrameworkChoice(
        options.framework
      );
      if (frameworkChoice && options.setDefault) {
        xplatSettings.defaultFramework = frameworkChoice;
      }

      const dependencies = {};
      dependencies[`@${getNpmScope()}/web`] = 'file:xplat/web';
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
        },
        xplatSettings
      )(tree, context);
    };
  }
}
