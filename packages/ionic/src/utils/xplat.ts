import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope } from '@nstudio/xplat';
import {
  ionicNativeCoreVersion,
  ionicNativeSplashScreenVersion,
  ionicNativeStatusbarVersion
} from './versions';

export namespace XplatIonicHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      dependencies[`@${getNpmScope()}/web-scss`] = `file:xplat/web/scss`;
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies,
        devDependencies: {
          '@ionic-native/core': ionicNativeCoreVersion,
          '@ionic-native/splash-screen': ionicNativeSplashScreenVersion,
          '@ionic-native/status-bar': ionicNativeStatusbarVersion
        }
      })(tree, context);
    };
  }
}
