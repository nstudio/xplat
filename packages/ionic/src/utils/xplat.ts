import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope } from '@nstudio/xplat';
import {
  ionicNativeCoreVersion,
  ionicNativeSplashScreenVersion,
  ionicNativeStatusbarVersion,
  capacitorCore,
  stencilCore,
  stencilSass,
  ionicCore
} from './versions';

export namespace XplatIonicHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      if (options.skipDependentPlatformFiles) {
        dependencies[`@${getNpmScope()}/web-scss`] = `file:xplat/web/scss`;
        dependencies['@ionic-native/core'] = ionicNativeCoreVersion;
        dependencies[
          '@ionic-native/splash-screen'
        ] = ionicNativeSplashScreenVersion;
        dependencies['@ionic-native/status-bar'] = ionicNativeStatusbarVersion;
      } else {
        dependencies['@ionic/core'] = ionicCore;
      }

      const devDependencies = {};
      if (!options.skipDependentPlatformFiles) {
        // using core deps
        devDependencies['@capacitor/cli'] = capacitorCore;
        devDependencies['@stencil/core'] = stencilCore;
        devDependencies['@stencil/sass'] = stencilSass;
      }
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies
        },
        devDependencies: {
          ...devDependencies
        }
      })(tree, context);
    };
  }
}
