import { Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import { XplatHelpers, IXplatSettings } from '@nstudio/xplat';

export namespace XplatElectronAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const xplatSettings: IXplatSettings = {}; 
      const frameworkChoice = XplatHelpers.getFrameworkChoice(options.framework);
      if (frameworkChoice && options.setDefault) {
        xplatSettings.defaultFramework = frameworkChoice;
      }

      return XplatHelpers.updatePackageForXplat(options, {
        // nothing extra needed at moment
        dependencies: {

        }
      }, xplatSettings)(tree, context);
    };
  }
}
