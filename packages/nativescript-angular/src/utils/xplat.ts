import { Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  updateFile,
  XplatHelpers,
  IXplatSettings,
} from '@nstudio/xplat';
import { nsNgVersion, nsNgFonticonVersion } from './versions';

export namespace XplatNativeScriptAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      return XplatHelpers.updatePackageForXplat(
        options,
        {
          dependencies: {
            'nativescript-angular': nsNgVersion,
            'nativescript-ngx-fonticon': nsNgFonticonVersion
          }
        }
      )(tree, context);
    };
  }

  export function addReferences() {
    return (tree: Tree) => {
      const filename = 'references.d.ts';
      if (!tree.exists(filename)) {
        // add references.d.ts
        tree.create(
          filename,
          `/// <reference path="./node_modules/tns-platform-declarations/ios.d.ts" />
  /// <reference path="./node_modules/tns-platform-declarations/android.d.ts" />
      `
        );
      }
      return tree;
    };
  }
}
