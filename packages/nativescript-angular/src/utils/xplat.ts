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
  codelyzerVersion,
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
        angularDeps['zone.js'] = zonejsVersion;

        angularDevDeps['@angular-eslint/eslint-plugin'] = angularEsLintVersion;
        angularDevDeps['@angular-eslint/eslint-plugin-template'] =
          angularEsLintVersion;
        angularDevDeps['@angular-eslint/template-parser'] =
          angularEsLintVersion;
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
