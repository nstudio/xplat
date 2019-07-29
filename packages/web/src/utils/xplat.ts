import { Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import { updateFile, XplatHelpers, getNpmScope } from '@nstudio/xplat';

export namespace XplatWebHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    // nothing extra needed at moment
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      dependencies[`@${getNpmScope()}/scss`] = 'file:libs/scss';

      return XplatHelpers.updatePackageForXplat(options, {
        dependencies
      })(tree, context);
    };
  }
}
