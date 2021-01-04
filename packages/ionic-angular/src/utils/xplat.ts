import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, IXplatSettings } from '@nstudio/xplat';
import { getNpmScope, getJsonFromFile } from '@nstudio/xplat-utils';
import {
  ionicAngularVersion,
  ionicAngularToolkitVersion,
  capacitorVersion,
  ngDevKitArchitect,
  ngDevKitBuild,
  ngDevKitCore,
  ngDevKitSchematics,
  angularVersion,
  coreJsVersion,
  rxjsVersion,
  zonejsVersion,
  codelyzerVersion,
  ngxTranslateVersion,
  ngxTranslateHttpVersion,
  xplatVersion,
  jasmineCoreVersion,
  jasmineSpecVersion,
  karmaVersion,
  karmaChromeVersion,
  karmaCoverageVersion,
  karmaJasmineVersion,
  karmaJasmineHtmlVersion,
} from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      const devDependencies = {};
      const xplatFoldername = XplatHelpers.getXplatFoldername('web', 'angular');

      if (options.useXplat) {
        dependencies[
          `@${getNpmScope()}/xplat-web-scss`
        ] = `file:libs/xplat/${xplatFoldername}/scss/src`;
        const ionicXplatFoldername = XplatHelpers.getXplatFoldername(
          'ionic',
          'angular'
        );
        dependencies[
          `@${getNpmScope()}/xplat-ionic-scss`
        ] = `file:libs/xplat/${ionicXplatFoldername}/scss/src`;
      }

      const packageJson = getJsonFromFile(tree, 'package.json');
      const hasAngularDeps = packageJson.dependencies['@angular/core'];
      if (!hasAngularDeps) {
        dependencies[`@angular/animations`] = angularVersion;
        dependencies[`@angular/common`] = angularVersion;
        dependencies[`@angular/compiler`] = angularVersion;
        dependencies[`@angular/core`] = angularVersion;
        dependencies[`@angular/forms`] = angularVersion;
        dependencies[`@angular/platform-browser`] = angularVersion;
        dependencies[`@angular/platform-browser-dynamic`] = angularVersion;
        dependencies[`@angular/router`] = angularVersion;
        dependencies[`core-js`] = coreJsVersion;
        dependencies[`rxjs`] = rxjsVersion;
        dependencies[`zone.js`] = zonejsVersion;

        devDependencies[`@angular/cli`] = angularVersion;
        devDependencies[`@angular/compiler-cli`] = angularVersion;
        devDependencies[`@angular/language-service`] = angularVersion;
        devDependencies[`codelyzer`] = codelyzerVersion;
      }

      const hasIonicAngularDeps = packageJson.dependencies['@ionic/angular'];
      if (!hasIonicAngularDeps) {
        dependencies[`@ionic/angular`] = ionicAngularVersion;
      }
      const hasCapacitorDeps = packageJson.dependencies['@capacitor/core'];
      if (!hasCapacitorDeps) {
        dependencies[`@capacitor/core`] = capacitorVersion;
      }
      if (options.useXplat) {
        dependencies['@ngx-translate/core'] = ngxTranslateVersion;
        dependencies['@ngx-translate/http-loader'] = ngxTranslateHttpVersion;
      }

      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies,
        },
        devDependencies: {
          ...devDependencies,
          '@angular-devkit/architect': ngDevKitArchitect,
          '@angular-devkit/build-angular': ngDevKitBuild,
          '@angular-devkit/core': ngDevKitCore,
          '@angular-devkit/schematics': ngDevKitSchematics,
          '@ionic/angular-toolkit': ionicAngularToolkitVersion,
          '@types/jasmine': '~3.6.2',
          '@types/jasminewd2': '~2.0.3',
          codelyzer: codelyzerVersion,
          'jasmine-core': jasmineCoreVersion,
          'jasmine-spec-reporter': jasmineSpecVersion,
          karma: karmaVersion,
          'karma-chrome-launcher': karmaChromeVersion,
          'karma-coverage-istanbul-reporter': karmaCoverageVersion,
          'karma-jasmine': karmaJasmineVersion,
          'karma-jasmine-html-reporter': karmaJasmineHtmlVersion,
        },
      })(tree, context);
    };
  }
}
