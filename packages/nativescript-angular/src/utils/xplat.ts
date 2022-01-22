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
  sassVersion,
  nsCoreVersion,
  angularVersion,
  ngToolsWebpack,
  ngxTranslateVersion,
  rxjsVersion,
  zonejsVersion,
  angularEsLintVersion,
  nsEsLintVersion,
  tsEsLintParserVersion,
  esLintVersion,
  nsWebpackVersion,
} from './versions';

export namespace XplatNativeScriptAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const packagePath = 'package.json';
      let packageJson = getJsonFromFile(tree, packagePath);

      const angularDeps = {};
      const angularDevDeps = {};
      let ngVersion: string;
      if (packageJson.dependencies) {
        if (packageJson.dependencies['@angular/core']) {
          // use existing
          ngVersion = packageJson.dependencies['@angular/core'];
        } else {
          ngVersion = angularVersion;
        }
        // ensure angular deps are present and versions are in sync
        angularDeps['@angular/animations'] = ngVersion;
        angularDeps['@angular/common'] = ngVersion;
        angularDeps['@angular/compiler'] = ngVersion;
        angularDeps['@angular/core'] = ngVersion;
        angularDeps['@angular/forms'] = ngVersion;
        angularDeps['@angular/platform-browser'] = ngVersion;
        angularDeps['@angular/platform-browser-dynamic'] = ngVersion;
        angularDeps['@angular/router'] = ngVersion;
        angularDeps['@ngx-translate/core'] = ngxTranslateVersion;
        angularDeps['rxjs'] = rxjsVersion;
        angularDeps['zone.js'] = zonejsVersion;

        // devDeps
        angularDevDeps[`@angular-devkit/build-angular`] = ngVersion;
        angularDevDeps['@angular/compiler-cli'] = ngVersion;
        angularDevDeps['@angular/language-service'] = ngVersion;

        if (!angularDevDeps['@angular-eslint/eslint-plugin']) {
          angularDevDeps['@angular-eslint/eslint-plugin'] =
            angularEsLintVersion;
        }
        if (!angularDevDeps['@angular-eslint/eslint-plugin-template']) {
          angularDevDeps['@angular-eslint/eslint-plugin-template'] =
            angularEsLintVersion;
        }
        if (!angularDevDeps['@angular-eslint/template-parser']) {
          angularDevDeps['@angular-eslint/template-parser'] =
            angularEsLintVersion;
        }
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
          '@nativescript/eslint-plugin': nsEsLintVersion,
          '@nativescript/webpack': nsWebpackVersion,
          '@ngtools/webpack': ngToolsWebpack,
          eslint: esLintVersion,
          sass: sassVersion,
          '@typescript-eslint/parser': tsEsLintParserVersion,
        },
      })(tree, context);
    };
  }
}
