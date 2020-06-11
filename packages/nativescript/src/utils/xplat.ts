import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { updateFile, XplatHelpers } from '@nstudio/xplat';
import {
  terserWebpackVersion,
  nsCoreVersion,
  nsThemeCoreVersion,
  nodeSassVersion
} from './versions';

export namespace XplatNativeScriptHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          '@nativescript/core': nsCoreVersion,
          'nativescript-theme-core': nsThemeCoreVersion,
        },
        devDependencies: {
          'node-sass': nodeSassVersion,
          'terser-webpack-plugin': terserWebpackVersion,
          'tns-platform-declarations': nsCoreVersion
        }
      })(tree, context);
    };
  }

  export function updatePrettierIgnore() {
    return XplatHelpers.updatePrettierIgnore(
      `\n
# xplat added rules
**/*.d.ts
**/apps/**/platforms/**/*
**/App_Resources/**/*
**/apps/nativescript*/hooks/**/*
**/apps/nativescript*/tools/**/*
**/apps/nativescript*/src/assets/*.min.css
**/apps/*nativescript/hooks/**/*
**/apps/*nativescript/tools/**/*
**/apps/*nativescript/src/assets/*.css
**/xplat/nativescript/scss/fonticons/*.css
**/xplat/nativescript*/plugins/**/*`,
      '**/xplat/nativescript/scss/fonticons/*.css'
    );
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
