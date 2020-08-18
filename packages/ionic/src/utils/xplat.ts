import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers  } from '@nstudio/xplat';
import {
  getNpmScope
} from '@nstudio/xplat-utils';
import {
  ionicNativeCoreVersion,
  ionicNativeSplashScreenVersion,
  ionicNativeStatusbarVersion,
  capacitorVersion,
  stencilCore,
  stencilSass,
  ionicCore
} from './versions';

export namespace XplatIonicHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      if (options.skipDependentPlatformFiles) {
        if (options.useXplat) {
          dependencies[`@${getNpmScope()}/web-scss`] = `file:xplat/web/scss`;
        }
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
