import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, IXplatSettings } from '@nstudio/xplat';
import {
  updateFile,
  getJsonFromFile,
  updateJsonFile,
} from '@nstudio/xplat-utils';
import {
  nsNgScopedVersion,
  nsNgFonticonVersion,
  nodeSassVersion,
  nsCoreVersion,
  angularVersion,
  ngxTranslateVersion,
  rxjsVersion,
  tslibVersion,
  codelyzerVersion,
  zonejsVersion,
  nsIntlVersion,
} from './versions';

export namespace XplatNativeScriptAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const packagePath = 'package.json';
      let packageJson = getJsonFromFile(tree, packagePath);

      const angularDeps = {};
      const angularDevDeps = {};
      if (
        packageJson.dependencies &&
        !packageJson.dependencies['@angular/core']
      ) {
        // ensure angular deps are present
        angularDeps['@angular/animations'] = angularVersion;
        angularDeps['@angular/common'] = angularVersion;
        angularDeps['@angular/compiler'] = angularVersion;
        angularDeps['@angular/core'] = angularVersion;
        angularDeps['@angular/forms'] = angularVersion;
        angularDeps['@angular/platform-browser'] = angularVersion;
        angularDeps['@angular/platform-browser-dynamic'] = angularVersion;
        angularDeps['@angular/router'] = angularVersion;
        angularDeps['@ngx-translate/core'] = ngxTranslateVersion;
        angularDeps['rxjs'] = rxjsVersion;
        angularDeps['tslib'] = tslibVersion;
        angularDeps['zone.js'] = zonejsVersion;

        angularDevDeps['@angular/compiler-cli'] = angularVersion;
        angularDevDeps['@angular/language-service'] = angularVersion;
        angularDevDeps['codelyzer'] = codelyzerVersion;
      }
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...angularDeps,
          '@nativescript/angular': nsNgScopedVersion,
          '@nativescript/core': nsCoreVersion,
          'nativescript-ngx-fonticon': nsNgFonticonVersion,
        },
        devDependencies: {
          ...angularDevDeps,
          'node-sass': nodeSassVersion,
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
          `/// <reference path="./node_modules/@nativescript/types/ios.d.ts" />
  /// <reference path="./node_modules/@nativescript/types/android.d.ts" />
      `
        );
      }
      return tree;
    };
  }
}
