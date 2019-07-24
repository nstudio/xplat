import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope, IXplatSettings } from '@nstudio/xplat';
import { ionicAngularVersion, ionicAngularToolkitVersion } from './versions';

export namespace XplatIonicAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      const xplatFoldername = XplatHelpers.getXplatFoldername('web', 'angular');
      dependencies[
        `@${getNpmScope()}/web-scss`
      ] = `file:xplat/${xplatFoldername}/scss`;
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies,
          '@ionic/angular': ionicAngularVersion
        },
        devDependencies: {
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
          'karma-jasmine-html-reporter': '^0.2.2'
        }
      })(tree, context);
    };
  }
}
