import {
  Tree,
  SchematicContext,
  noop,
  branchAndMerge,
  mergeWith,
  apply,
  template,
  url,
  move,
  Rule,
  SchematicsException,
  externalSchematic,
} from '@angular-devkit/schematics';
import {
  generateOptionError,
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  needFeatureModuleError,
  getDefaultTemplateOptions,
  unsupportedPlatformError,
  noPlatformError,
  XplatHelpers,
  XplatComponentHelpers,
} from '@nstudio/xplat';
import {
  prerun,
  supportedPlatforms,
  PlatformTypes,
  getPrefix,
  updateJsonFile,
  getJsonFromFile,
  sanitizeCommaDelimitedArg,
  getNpmScope,
  getFrontendFramework,
  parseProjectNameFromPath,
} from '@nstudio/xplat-utils';
import { addToFeature, adjustBarrelIndex } from './generator';
import {
  ngxTranslateVersion,
  ngxTranslateHttpVersion,
  nxVersion,
  angularVersion,
  coreJsVersion,
  rxjsVersion,
  zonejsVersion,
  angularDevkitVersion,
  xplatVersion,
  jestPresetAngular,
  typesJest,
} from './versions';

export namespace ComponentHelpers {
  export function platformGenerator(
    options: XplatComponentHelpers.Schema,
    platform: PlatformTypes
  ) {
    const chains: Array<any> = [prerun()];
    const componentSettings = XplatComponentHelpers.prepare(options);

    if (options.onlyProject) {
      for (const fullProjectPath of componentSettings.projectNames) {
        const projectName = parseProjectNameFromPath(fullProjectPath);
        const projectParts = projectName.split('-');
        const platPrefix = <PlatformTypes>projectParts[0];
        const platSuffix = <PlatformTypes>projectParts.pop();

        if (platPrefix === platform || platSuffix === platform) {
          const appDir = platform === 'web' ? '/app' : '';
          const prefixPath = `apps/${fullProjectPath}/src${appDir}`;
          const featurePath = `${prefixPath}/features/${
            componentSettings.directory ? componentSettings.directory + '/' : ''
          }${componentSettings.featureName}`;
          const featureModulePath = `${featurePath}/${componentSettings.featureName}.module.ts`;
          const barrelIndex = `${featurePath}/components/index.ts`;
          // console.log('will adjustProject:', projectName);
          chains.push((tree: Tree, context: SchematicContext) => {
            if (!tree.exists(featureModulePath)) {
              throw new Error(
                needFeatureModuleError(
                  featureModulePath,
                  componentSettings.featureName,
                  fullProjectPath,
                  true
                )
              );
            }
            return addToFeature(
              '',
              'component',
              options,
              prefixPath,
              tree
            )(tree, context);
          });
          chains.push((tree: Tree, context: SchematicContext) => {
            return adjustBarrelIndex(
              'component',
              options,
              barrelIndex,
              true
            )(tree, context);
          });
          chains.push((tree: Tree, context: SchematicContext) => {
            return addToFeature(
              '',
              'component',
              options,
              prefixPath,
              tree,
              '_index'
            )(tree, context);
          });
        }
      }
    } else {
      // add component
      chains.push((tree: Tree, context: SchematicContext) => {
        const xplatFolderName = XplatHelpers.getXplatFoldername(
          platform,
          'angular'
        );
        return addToFeature(
          xplatFolderName,
          'component',
          options,
          `libs/xplat/${xplatFolderName}`,
          tree,
          ``,
          true
        )(tree, context);
      });
      if (options.subFolder) {
        // adjust components barrel for subFolder
        chains.push((tree: Tree, context: SchematicContext) => {
          const xplatFolderName = XplatHelpers.getXplatFoldername(
            platform,
            'angular'
          );
          return adjustBarrelIndex(
            'component',
            options,
            `libs/xplat/${xplatFolderName}/features/src/lib/${
              componentSettings.directory
                ? componentSettings.directory + '/'
                : ''
            }${componentSettings.featureName}/components/${
              options.subFolder
            }/index.ts`,
            true
          )(tree, context);
        });
        chains.push((tree: Tree, context: SchematicContext) => {
          const xplatFolderName = XplatHelpers.getXplatFoldername(
            platform,
            'angular'
          );
          return options.needsIndex
            ? addToFeature(
                xplatFolderName,
                'component',
                options,
                `libs/xplat/${xplatFolderName}`,
                tree,
                '_index',
                true
              )(tree, context)
            : noop()(tree, context);
        });
      }
      // adjust overall components barrel
      chains.push((tree: Tree, context: SchematicContext) => {
        const xplatFolderName = XplatHelpers.getXplatFoldername(
          platform,
          'angular'
        );
        return adjustBarrelIndex(
          'component',
          options,
          `libs/xplat/${xplatFolderName}/features/src/lib/${
            componentSettings.directory ? componentSettings.directory + '/' : ''
          }${componentSettings.featureName}/components/index.ts`,
          true,
          false,
          true
        )(tree, context);
      });

      chains.push((tree: Tree, context: SchematicContext) => {
        const xplatFolderName = XplatHelpers.getXplatFoldername(
          platform,
          'angular'
        );
        return options.needsIndex
          ? addToFeature(
              xplatFolderName,
              'component',
              options,
              `libs/xplat/${xplatFolderName}`,
              tree,
              '_index'
            )(tree, context)
          : noop()(tree, context);
      });
    }

    return chains;
  }
}

export namespace XplatAngularHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      const devDependencies = {};
      const packageJson = getJsonFromFile(tree, 'package.json');
      let ngVersion: string;
      if (packageJson.dependencies) {
        if (packageJson.dependencies['@angular/core']) {
          // use existing
          ngVersion = packageJson.dependencies['@angular/core'];
        } else {
          ngVersion = angularVersion;
        }
        dependencies[`@angular/animations`] = ngVersion;
        dependencies[`@angular/common`] = ngVersion;
        dependencies[`@angular/compiler`] = ngVersion;
        dependencies[`@angular/core`] = ngVersion;
        dependencies[`@angular/forms`] = ngVersion;
        dependencies[`@angular/platform-browser`] = ngVersion;
        dependencies[`@angular/platform-browser-dynamic`] = ngVersion;
        dependencies[`@angular/router`] = ngVersion;
        dependencies[`core-js`] = coreJsVersion;
        dependencies[`rxjs`] = rxjsVersion;
        dependencies[`zone.js`] = zonejsVersion;

        devDependencies[`@angular/compiler-cli`] = ngVersion;
        devDependencies[`@angular/language-service`] = ngVersion;
      }

      if (!packageJson.devDependencies['@nx/angular']) {
        packageJson.devDependencies['@nx/angular'] = nxVersion;
      }
      if (!packageJson.devDependencies['@nx/jest']) {
        packageJson.devDependencies['@nx/jest'] = nxVersion;
      }
      if (!packageJson.devDependencies['@nstudio/web']) {
        packageJson.devDependencies['@nstudio/web'] = xplatVersion;
      }

      dependencies[`@${getNpmScope()}/xplat-scss`] = 'file:libs/xplat/scss/src';

      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies,
          '@ngx-translate/core': ngxTranslateVersion,
          '@ngx-translate/http-loader': ngxTranslateHttpVersion,
        },
        devDependencies: {
          ...devDependencies,
          '@types/jest': typesJest,
          'jest-preset-angular': jestPresetAngular,
        },
      })(tree, context);
    };
  }

  export function externalChains(options: XplatHelpers.Schema) {
    const platforms = XplatHelpers.getPlatformsFromOption(options.platforms);
    const chains = [];

    for (const platform of platforms) {
      // console.log('angular externalChains:', `@nstudio/${platform}-angular`)
      chains.push(
        externalSchematic(`@nstudio/${platform}-angular`, 'xplat', options, {
          interactive: false,
        })
      );
    }
    return chains;
  }

  export function addLibFiles(
    options: XplatHelpers.Schema,
    relativeTo: string = './',
    libName: string
  ): Rule {
    return (tree: Tree, context: SchematicContext) => {
      if (
        libName === 'scss' &&
        tree.exists(`libs/xplat/${libName}/src/package.json`)
      ) {
        return noop()(tree, context);
      } else if (tree.exists(`libs/xplat/${libName}/src/lib/index.ts`)) {
        return noop()(tree, context);
      }

      const libSrcFolder = `/${libName}/src${libName === 'scss' ? '' : '/lib'}`;

      return branchAndMerge(
        mergeWith(
          apply(url(`${relativeTo}_files_${libName}`), [
            template({
              ...(options as any),
              ...getDefaultTemplateOptions(),
            }),
            move(`libs/xplat/${libSrcFolder}`),
          ])
        )
      )(tree, context);
    };
  }
}
