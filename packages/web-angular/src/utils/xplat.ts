import { Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import {
  updateFile
} from '@nstudio/xplat-utils';

export namespace XplatWebAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    // nothing extra needed at moment
    return noop();
    // return (tree: Tree, context: SchematicContext) => {
    //   return XplatHelpers.updatePackageForXplat(options, {
    //     dependencies: {

    //     }
    //   })(tree, context);
    // };
  }
}
