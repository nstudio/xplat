import { Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  XplatHelpers,
  getNpmScope,
  IXplatSettings,
  getJsonFromFile
} from '@nstudio/xplat';
import {
  ionicAngularVersion,
  ionicAngularToolkitVersion,
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
  karmaJasmineHtmlVersion
} from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      const devDependencies = {};
      const xplatFoldername = XplatHelpers.getXplatFoldername('web', 'angular');

      if (options.useXplat) {
        dependencies[
          `@${getNpmScope()}/web-scss`
        ] = `file:xplat/${xplatFoldername}/scss`;
        const ionicXplatFoldername = XplatHelpers.getXplatFoldername(
          'ionic',
          'angular'
        );
        dependencies[
          `@${getNpmScope()}/ionic-scss`
        ] = `file:xplat/${ionicXplatFoldername}/scss`;
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

      if (options.useXplat) {
        dependencies['@ngx-translate/core'] = ngxTranslateVersion;
        dependencies['@ngx-translate/http-loader'] = ngxTranslateHttpVersion;
      }

      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies,
          '@ionic/angular': ionicAngularVersion
        },
        devDependencies: {
          ...devDependencies,
          '@angular-devkit/architect': ngDevKitArchitect,
          '@angular-devkit/build-angular': ngDevKitBuild,
          '@angular-devkit/core': ngDevKitCore,
          '@angular-devkit/schematics': ngDevKitSchematics,
          '@ionic/angular-toolkit': ionicAngularToolkitVersion,
          '@types/jasmine': '~3.5.9',
          '@types/jasminewd2': '~2.0.3',
          codelyzer: codelyzerVersion,
          'jasmine-core': jasmineCoreVersion,
          'jasmine-spec-reporter': jasmineSpecVersion,
          karma: karmaVersion,
          'karma-chrome-launcher': karmaChromeVersion,
          'karma-coverage-istanbul-reporter': karmaCoverageVersion,
          'karma-jasmine': karmaJasmineVersion,
          'karma-jasmine-html-reporter': karmaJasmineHtmlVersion
        }
      })(tree, context);
    };
  }
}
