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
  ngxTranslateHttpLoaderVersion,
  reflectMetadataVersion,
  xplatVersion
} from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      const devDependencies = {};
      const xplatFoldername = XplatHelpers.getXplatFoldername('web', 'angular');
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

        devDependencies[`@angular/compiler-cli`] = angularVersion;
        devDependencies[`@angular/language-service`] = angularVersion;
        devDependencies[`codelyzer`] = codelyzerVersion;
      }

      dependencies['@ngx-translate/core'] = ngxTranslateVersion;
      dependencies[
        '@ngx-translate/http-loader'
      ] = ngxTranslateHttpLoaderVersion;
      dependencies['reflect-metadata'] = reflectMetadataVersion;

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
          '@types/jasmine': '~2.8.8',
          '@types/jasminewd2': '~2.0.3',
          codelyzer: '~4.5.0',
          'jasmine-core': '~2.99.1',
          'jasmine-spec-reporter': '~4.2.1',
          karma: '~4.1.0',
          'karma-chrome-launcher': '~2.2.0',
          'karma-coverage-istanbul-reporter': '~2.0.1',
          'karma-jasmine': '~1.1.2',
          'karma-jasmine-html-reporter': '^0.2.2',
          protractor: '^5.4.2'
        }
      })(tree, context);
    };
  }
}
