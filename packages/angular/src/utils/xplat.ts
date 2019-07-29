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
  SchematicsException,
  externalSchematic
} from '@angular-devkit/schematics';
import {
  generateOptionError,
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  supportedPlatforms,
  PlatformTypes,
  needFeatureModuleError,
  getPrefix,
  updateJsonFile,
  getJsonFromFile,
  getDefaultTemplateOptions,
  unsupportedPlatformError,
  sanitizeCommaDelimitedArg,
  noPlatformError,
  XplatHelpers,
  getNpmScope,
  prerun,
  XplatComponentHelpers
} from '@nstudio/xplat';
import { addToFeature, adjustBarrelIndex } from './generator';
import { updateJsonInTree, getWorkspacePath } from '@nrwl/workspace';
import {
  ngxTranslateVersion,
  ngxTranslateHttpLoaderVersion,
  nxVersion,
  reflectMetadataVersion,
  angularVersion,
  coreJsVersion,
  rxjsVersion,
  zonejsVersion,
  angularDevkitVersion,
  codelyzerVersion,
  xplatVersion
} from './versions';

export namespace ComponentHelpers {
  export function platformGenerator(
    options: XplatComponentHelpers.Schema,
    platform: PlatformTypes
  ) {
    const chains: Array<any> = [prerun()];
    const componentSettings = XplatComponentHelpers.prepare(options);

    if (options.onlyProject) {
      for (const projectName of componentSettings.projectNames) {
        const projectParts = projectName.split('-');
        const platPrefix = projectParts[0];
        const platSuffix = projectParts.pop();
        if (platPrefix === platform || platSuffix === platform) {
          const appDir = platform === 'web' ? '/app' : '';
          const prefixPath = `apps/${projectName}/src${appDir}`;
          const featurePath = `${prefixPath}/features/${
            componentSettings.featureName
          }`;
          const featureModulePath = `${featurePath}/${
            componentSettings.featureName
          }.module.ts`;
          const barrelIndex = `${featurePath}/components/index.ts`;
          // console.log('will adjustProject:', projectName);
          chains.push((tree: Tree, context: SchematicContext) => {
            if (!tree.exists(featureModulePath)) {
              throw new Error(
                needFeatureModuleError(
                  featureModulePath,
                  componentSettings.featureName,
                  projectName,
                  true
                )
              );
            }
            return addToFeature('', 'component', options, prefixPath, tree)(
              tree,
              context
            );
          });
          chains.push((tree: Tree, context: SchematicContext) => {
            return adjustBarrelIndex('component', options, barrelIndex, true)(
              tree,
              context
            );
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
          `xplat/${xplatFolderName}`,
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
            `xplat/${xplatFolderName}/features/${
              componentSettings.featureName
            }/components/${options.subFolder}/index.ts`,
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
                `xplat/${xplatFolderName}`,
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
          `xplat/${xplatFolderName}/features/${
            componentSettings.featureName
          }/components/index.ts`,
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
              `xplat/${xplatFolderName}`,
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
        devDependencies[`@angular-devkit/build-angular`] = angularDevkitVersion;
        devDependencies[`codelyzer`] = codelyzerVersion;
      }

      if (!packageJson.devDependencies['@nrwl/angular']) {
        packageJson.devDependencies['@nrwl/angular'] = nxVersion;
      }
      if (!packageJson.devDependencies['@nstudio/web']) {
        packageJson.devDependencies['@nstudio/web'] = xplatVersion;
      }

      dependencies[`@${getNpmScope()}/scss`] = 'file:libs/scss';

      return XplatHelpers.updatePackageForXplat(options, {
        dependencies: {
          ...dependencies,
          '@ngx-translate/core': ngxTranslateVersion,
          '@ngx-translate/http-loader': ngxTranslateHttpLoaderVersion,
          'reflect-metadata': reflectMetadataVersion
        },
        devDependencies
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
          interactive: false
        })
      );
    }
    return chains;
  }

  export function addLibFiles(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      if (
        tree.exists(`libs/core/base/base-component.ts`) ||
        tree.exists(`libs/features/index.ts`)
      ) {
        return noop();
      }

      return branchAndMerge(
        mergeWith(
          apply(url(`./_lib_files`), [
            template({
              ...(options as any),
              ...getDefaultTemplateOptions()
            }),
            move('libs')
          ])
        )
      );
    };
  }

  export function addTestingFiles(options: any, relativePath: string = './') {
    return (tree: Tree, context: SchematicContext) => {
      if (tree.exists(`testing/karma.conf.js`)) {
        return noop();
      }

      return branchAndMerge(
        mergeWith(
          apply(url(`${relativePath}_files`), [
            template({
              ...(options as any),
              ...getDefaultTemplateOptions(),
              xplatFolderName: XplatHelpers.getXplatFoldername('web', 'angular')
            }),
            move('testing')
          ])
        )
      );
    };
  }

  export function updateTestingConfig(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const configPath = getWorkspacePath(tree);
      const nxConfigPath = `nx.json`;

      const workspaceJson = getJsonFromFile(tree, configPath);
      const nxJson = getJsonFromFile(tree, nxConfigPath);
      const prefix = getPrefix();
      // console.log('prefix:', prefix);

      // update libs and xplat config
      if (workspaceJson && workspaceJson.projects) {
        workspaceJson.projects['libs'] = {
          root: 'libs',
          sourceRoot: 'libs',
          projectType: 'library',
          prefix: prefix,
          architect: {
            test: {
              builder: '@angular-devkit/build-angular:karma',
              options: {
                main: 'testing/test.libs.ts',
                tsConfig: 'testing/tsconfig.libs.spec.json',
                karmaConfig: 'testing/karma.conf.js'
              }
            },
            lint: {
              builder: '@angular-devkit/build-angular:tslint',
              options: {
                tsConfig: [
                  'testing/tsconfig.libs.json',
                  'testing/tsconfig.libs.spec.json'
                ],
                exclude: ['**/node_modules/**']
              }
            }
          }
        };
        workspaceJson.projects['xplat'] = {
          root: 'xplat',
          sourceRoot: 'xplat',
          projectType: 'library',
          prefix: prefix,
          architect: {
            test: {
              builder: '@angular-devkit/build-angular:karma',
              options: {
                main: 'testing/test.xplat.ts',
                tsConfig: 'testing/tsconfig.xplat.spec.json',
                karmaConfig: 'testing/karma.conf.js'
              }
            },
            lint: {
              builder: '@angular-devkit/build-angular:tslint',
              options: {
                tsConfig: [
                  'testing/tsconfig.xplat.json',
                  'testing/tsconfig.xplat.spec.json'
                ],
                exclude: ['**/node_modules/**']
              }
            }
          }
        };
      }

      if (nxJson && nxJson.projects) {
        nxJson.projects['libs'] = {
          tags: []
        };
        nxJson.projects['xplat'] = {
          tags: []
        };
      }

      tree = updateJsonFile(tree, configPath, workspaceJson);
      tree = updateJsonFile(tree, nxConfigPath, nxJson);
      return tree;
    };
  }

  export function updateLint(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const prefix = getPrefix();

      return updateJsonInTree('tslint.json', json => {
        json.rules = json.rules || {};
        // remove forin rule as collides with LogService
        delete json.rules['forin'];
        // adjust console rules to work with LogService
        json.rules['no-console'] = [true, 'debug', 'time', 'timeEnd', 'trace'];
        json.rules['directive-selector'] = [
          true,
          'attribute',
          prefix,
          'camelCase'
        ];
        json.rules['component-selector'] = [
          true,
          'element',
          prefix,
          'kebab-case'
        ];

        return json;
      })(tree, context);
    };
  }
}
