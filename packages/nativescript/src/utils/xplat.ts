import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { updateFile, XplatHelpers } from '@nstudio/xplat';
import {
  terserWebpackVersion,
  tnsCoreVersion,
  nsThemeCoreVersion,
  nodeSassVersion
} from './versions';

export namespace XplatNativeScriptHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          'nativescript-theme-core': nsThemeCoreVersion,
          'tns-core-modules': tnsCoreVersion
        },
        devDependencies: {
          'node-sass': nodeSassVersion,
          'terser-webpack-plugin': terserWebpackVersion,
          'tns-platform-declarations': tnsCoreVersion
        }
      })(tree, context);
    };
  }

  export function updateGitIgnore() {
    return (tree: Tree) => {
      const gitIgnorePath = '.gitignore';
      let gitIgnore = tree.get(gitIgnorePath).content.toString();
      if (gitIgnore) {
        if (gitIgnore.indexOf('# nativescript') === -1) {
          gitIgnore += `
# nativescript
hooks
      `;
        }
      }

      return updateFile(tree, gitIgnorePath, gitIgnore);
    };
  }
}
