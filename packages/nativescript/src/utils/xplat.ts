import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import { updateFile } from '@nstudio/xplat-utils';
import { nsCoreVersion, nsThemeCoreVersion, sassVersion } from './versions';

export namespace XplatNativeScriptHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          '@nativescript/core': nsCoreVersion,
          'nativescript-theme-core': nsThemeCoreVersion,
        },
        devDependencies: {
          'sass': sassVersion,
          '@nativescript/types': nsCoreVersion,
        },
      })(tree, context);
    };
  }

  export function addReferences() {
    return (tree: Tree) => {
      const filename = 'references.d.ts';
      if (!tree.exists(filename)) {
        // add references.d.ts
        tree.create(
          filename,
          `/// <reference path="./node_modules/@nativescript/types-ios/index.d.ts" />
/// <reference path="./node_modules/@nativescript/types-android/lib/android-29.d.ts" />
`
        );
      }
      return tree;
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
**/libs/xplat/nativescript/scss/src/lib/fonticons/*.css
**/libs/xplat/nativescript*/plugins/**/*`,
      '**/libs/xplat/nativescript/scss/src/lib/fonticons/*.css'
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
