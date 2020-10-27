import {
  Tree,
  noop,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
  SchematicContext,
  Rule,
  externalSchematic,
  SchematicsException,
} from '@angular-devkit/schematics';
import { createSourceFile, ScriptTarget } from 'typescript';
import {
  getDefaultTemplateOptions,
  stringUtils,
  supportedSandboxPlatforms,
  updateTsConfig,
  IXplatSettings,
} from './general';
import {
  getPrefix,
  updateJsonFile,
  getJsonFromFile,
  PlatformTypes,
  supportedPlatforms,
  getGroupByName,
  sanitizeCommaDelimitedArg,
  updateFile,
  getNxWorkspaceConfig,
  PlatformModes,
  isTesting,
  jsonParse,
  FrameworkTypes,
  getFrontendFramework,
  supportedFrameworks,
  PlatformWithNxTypes,
  supportedNxExtraPlatforms,
  PlatformNxExtraTypes,
  supportedPlatformsWithNx,
} from '@nstudio/xplat-utils';
import {
  updateJsonInTree,
  toFileName,
  serializeJson,
  readJsonInTree,
} from '@nrwl/workspace';
import { insert, addGlobal } from './ast';
import {
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  noPlatformError,
  unsupportedPlatformError,
  noteAboutXplatSetupWithFramework,
  unsupportedFrameworkError,
  generateOptionError,
  noXplatLayerNote,
} from './errors';
import {
  NodePackageInstallTask,
  RunSchematicTask,
} from '@angular-devkit/schematics/tasks';
import { xplatVersion, nxVersion } from './versions';
import { output } from './output';

export const packageInnerDependencies = {
  '@nstudio/angular': ['@nrwl/angular'],
  '@nstudio/electron-angular': [
    '@nrwl/angular',
    '@nstudio/electron',
    '@nstudio/angular',
  ],
  '@nstudio/ionic-angular': [
    '@nrwl/angular',
    '@nstudio/ionic',
    '@nstudio/angular',
    '@nstudio/web-angular',
  ],
  '@nstudio/nativescript-angular': [
    '@nrwl/angular',
    '@nstudio/nativescript',
    '@nstudio/angular',
  ],
  '@nstudio/web-angular': ['@nrwl/angular', '@nstudio/web', '@nstudio/angular'],
};

export namespace XplatHelpers {
  export interface Schema {
    /**
     * Target platforms
     */
    platforms?: string;
    /**
     * Target frameworks
     */
    framework?: string;
    /**
     * npm scope - auto detected from nx.json but can specify your own name
     */
    npmScope?: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * Skip dependent platform files
     */
    skipDependentPlatformFiles?: boolean;
    useXplat?: boolean;
    /**
     * Skip install
     */
    skipInstall?: boolean;
    /**
     * group by name
     */
    groupByName?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export interface NgAddSchema {
    /**
     * Target platforms
     */
    platforms?: string;
    /**
     * Target frameworks
     */
    framework?: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
  }

  export interface IXplatGeneratorOptions {
    featureName?: string;
    projectNames?: Array<string>;
    platforms: Array<PlatformWithNxTypes>;
  }

  /**
   * Calls ng-add _if_ the package does not already exist
   * Otherwise calls that schematic if desired, otherwise noop
   */
  export function addPackageWithNgAdd(
    packageName: string,
    options?: NgAddSchema,
    callSchematicIfAdded?: string
  ): Rule {
    return (host: Tree) => {
      const { dependencies, devDependencies } = readJsonInTree(
        host,
        'package.json'
      );
      return dependencies[packageName] || devDependencies[packageName]
        ? callSchematicIfAdded
          ? externalSchematic(packageName, callSchematicIfAdded, options, {
              interactive: false,
            })
          : noop()
        : externalSchematic(packageName, 'ng-add', options, {
            interactive: false,
          });
    };
  }

  export function getPlatformsFromOption(
    platformArgument: string = '',
    required: boolean = true
  ) {
    let platforms = [];
    if (platformArgument === 'all') {
      // conveniently add support for all supported platforms
      for (const platform of supportedPlatforms) {
        platforms.push(platform);
      }
    } else {
      const platformArgList = <Array<PlatformTypes>>(
        (<unknown>sanitizeCommaDelimitedArg(platformArgument))
      );
      if (platformArgList.length === 0) {
        if (required) {
          throw new Error(noPlatformError());
        }
      } else {
        for (const platform of platformArgList) {
          if (supportedPlatforms.includes(platform)) {
            platforms.push(platform);
          } else {
            throw new Error(unsupportedPlatformError(platform));
          }
        }
      }
    }
    return platforms;
  }

  export function getFrameworksFromOptions(frameworkArgument: string) {
    // will support comma delimited list of frameworks to generate support for
    // most common to generate 1 at a time but we will allow multiple
    // always default framework choice to first in list when multiple
    return <Array<FrameworkTypes>>(
      (<unknown>(
        (frameworkArgument === 'all'
          ? supportedFrameworks
          : sanitizeCommaDelimitedArg(frameworkArgument))
      ))
    );
  }

  export function getFrameworkChoice(
    frameworkArgument: string,
    frameworks?: Array<FrameworkTypes>
  ) {
    frameworks = frameworks || getFrameworksFromOptions(frameworkArgument);
    return frameworks.length ? frameworks[0] : null;
  }

  export function getUpdatedXplatSettings(options: Schema) {
    const frameworks = getFrameworksFromOptions(options.framework);
    const frameworkChoice = XplatHelpers.getFrameworkChoice(
      options.framework,
      frameworks
    );
    const xplatSettings: IXplatSettings = {
      prefix: getPrefix(),
    };

    if (frameworkChoice && frameworks.length === 1) {
      // when only 1 framework is specified, auto add as default
      xplatSettings.framework = frameworkChoice;
    }
    if (options.groupByName) {
      xplatSettings.groupByName = true;
    }
    return xplatSettings;
  }

  /**
   * Returns a name with the platform.
   *
   * @example (app, web) => web-app or app-web
   * @param name
   * @param platform
   */
  export function getPlatformName(name: string, platform: PlatformWithNxTypes) {
    const nameSanitized = toFileName(name);
    return getGroupByName()
      ? `${nameSanitized}-${platform}`
      : `${platform}-${nameSanitized}`;
  }

  /**
   * Returns xplat folder name dependent on settings.
   *
   * @example ('web', 'angular') => 'web-angular' if no default framework otherwise just 'web'
   * @param platform
   * @param framework
   */
  export function getXplatFoldername(
    platform: PlatformTypes,
    framework?: FrameworkTypes
  ) {
    const frontendFramework = getFrontendFramework();
    // console.log('getXplatFoldername frontendFramework:', frontendFramework);
    // console.log('framework:', framework);
    let frameworkSuffix = '';
    if (framework && frontendFramework !== framework) {
      // user had a default framework set
      // however an explicit framework is being requested
      // if they differ, use suffix to distinguish
      frameworkSuffix = `-${framework}`;
    }
    return `${platform}${frameworkSuffix}`;
  }

  export function getExternalChainsForGenerator(
    options: Schema,
    generator: string,
    packagesToRunXplat: Array<string>
  ) {
    let generatorSettings: IXplatGeneratorOptions;
    let isApp = false;
    switch (generator) {
      case 'component':
        generatorSettings = XplatComponentHelpers.prepare(<any>options);
        break;
      case 'feature':
        generatorSettings = XplatFeatureHelpers.prepare(<any>options);
        break;
      default:
        isApp = ['application', 'app'].includes(generator);
        generatorSettings = {
          platforms: <Array<PlatformWithNxTypes>>(
            (<unknown>sanitizeCommaDelimitedArg(options.platforms))
          ),
        };
        break;
    }
    const platforms = generatorSettings.platforms;
    const externalChains = [];
    const devDependencies = {};

    // frontend framework
    const frameworks = getFrameworksFromOptions(options.framework);
    const frameworkChoice = getFrameworkChoice(options.framework, frameworks);
    // console.log('frameworks:', frameworks);
    // console.log('frameworkChoice:', frameworkChoice);

    // console.log('platforms:', platforms);
    if (frameworks.length) {
      for (const framework of frameworks) {
        if (supportedFrameworks.includes(framework)) {
          if (platforms.length) {
            for (const platform of platforms) {
              if (
                framework === 'angular' &&
                (!isApp || (isApp && platform === 'web'))
              ) {
                // Angular generators start with @nstudio/angular and branch from there
                // Exception: if app generator and with web platform, also use this configuration
                const packageName = `@nstudio/angular`;
                devDependencies[packageName] = xplatVersion;
                // install platform dependencies
                devDependencies[`@nstudio/${platform}-angular`] = xplatVersion;
                devDependencies[`@nstudio/${platform}`] = xplatVersion;
                if (!packagesToRunXplat.includes(packageName)) {
                  packagesToRunXplat.push(packageName);
                }
              } else if (
                isApp &&
                supportedNxExtraPlatforms.includes(
                  <PlatformNxExtraTypes>platform
                )
              ) {
                // platforms that are supported directly via Nx only right now
                // 'app'/'application' is only schematic supported via xplat proxy at moment
                const packageName = `@nrwl/${platform}`;
                devDependencies[packageName] = nxVersion;
                packagesToRunXplat.push(packageName);
              } else {
                const packageName = `@nstudio/${platform}-${framework}`;
                devDependencies[packageName] = xplatVersion;
                // externalChains.push(externalSchematic(`@nstudio/${platform}-${framework}`, 'app', options));
                packagesToRunXplat.push(packageName);
              }
            }
          }
        } else {
          throw new SchematicsException(unsupportedFrameworkError(framework));
        }
      }
    } else if (platforms.length) {
      for (const platform of platforms) {
        if (supportedPlatforms.includes(<PlatformTypes>platform)) {
          const packageName = `@nstudio/${platform}`;
          devDependencies[packageName] = xplatVersion;
          // externalChains.push(externalSchematic(packageName, 'app', options));
          packagesToRunXplat.push(packageName);
        } else if (
          isApp &&
          supportedNxExtraPlatforms.includes(<PlatformNxExtraTypes>platform)
        ) {
          // platforms supported directly via Nx only right now
          // 'app'/'application' is only schematic supported via xplat proxy at moment
          const packageName = `@nrwl/${platform}`;
          devDependencies[packageName] = nxVersion;
          packagesToRunXplat.push(packageName);
        } else {
          throw new SchematicsException(unsupportedPlatformError(platform));
        }
      }
    }

    if (Object.keys(devDependencies).length) {
      externalChains.push((tree: Tree, context: SchematicContext) => {
        // check if othet nstudio or nrwl dependencies are needed
        // check user's package for current version
        const packageJson = getJsonFromFile(tree, 'package.json');
        if (packageJson) {
          for (const packageName in devDependencies) {
            if (packageInnerDependencies[packageName]) {
              // inner dependencies are either nstudio or nrwl based packages
              let version: string;
              // ensure inner schematic dependencies are installed
              for (const name of packageInnerDependencies[packageName]) {
                if (name.indexOf('nrwl') > -1) {
                  // default to internally managed/supported nrwl version
                  version = nxVersion;
                  // look for existing nrwl versions if user already has them installed and use those
                  if (
                    packageJson.dependencies &&
                    packageJson.dependencies[name]
                  ) {
                    version = packageJson.dependencies[name];
                  } else if (
                    packageJson.devDependencies &&
                    packageJson.devDependencies[name]
                  ) {
                    version = packageJson.devDependencies[name];
                  }
                  devDependencies[name] = version;
                } else {
                  devDependencies[name] = xplatVersion;
                }
              }
            }
          }
        }
        // console.log(devDependencies);

        return XplatHelpers.updatePackageForXplat(options, {
          devDependencies,
        })(tree, context);
      });

      if (options.isTesting) {
        // necessary to unit test the appropriately
        // console.log('packagesToRunXplat:', packagesToRunXplat)
        if (packagesToRunXplat.length) {
          for (const packageName of packagesToRunXplat) {
            externalChains.push(
              externalSchematic(packageName, generator, options, {
                interactive: false,
              })
            );
          }
        }
      } else {
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const installPackageTask = context.addTask(
            new NodePackageInstallTask()
          );

          // console.log('devDependencies:', devDependencies);
          // console.log('packagesToRunXplat:', packagesToRunXplat);
          for (const packageName of packagesToRunXplat) {
            context.addTask(
              new RunSchematicTask(packageName, generator, options),
              [installPackageTask]
            );
          }
        });
      }
    }
    return externalChains;
  }

  export function getExternalChainsForApplication(
    options: Schema,
    generator: string,
    packagesToRun: Array<string>
  ) {
    let generatorSettings: IXplatGeneratorOptions = {
      platforms: <Array<PlatformWithNxTypes>>(
        (<unknown>sanitizeCommaDelimitedArg(options.platforms))
      ),
    };
    const platforms = generatorSettings.platforms;
    const externalChains = [];
    const devDependencies = {};
    let xplatPlatforms = 0;

    // console.log('platforms:', platforms);
    if (platforms.length) {
      for (const platform of platforms) {
        if (supportedPlatforms.includes(<PlatformTypes>platform)) {
          xplatPlatforms++;
        } else if (
          supportedNxExtraPlatforms.includes(<PlatformNxExtraTypes>platform)
        ) {
          // platforms supported directly via Nx only right now
          // 'app'/'application' is only schematic supported via xplat proxy at moment
          const packageName = `@nrwl/${platform}`;
          devDependencies[packageName] = nxVersion;
          packagesToRun.push(packageName);
        } else {
          throw new SchematicsException(unsupportedPlatformError(platform));
        }
      }
    }

    if (Object.keys(devDependencies).length) {
      externalChains.push((tree: Tree, context: SchematicContext) => {
        // check if othet nstudio or nrwl dependencies are needed
        // check user's package for current version
        const packageJson = getJsonFromFile(tree, 'package.json');
        if (packageJson) {
          for (const packageName in devDependencies) {
            if (packageInnerDependencies[packageName]) {
              // inner dependencies are either nstudio or nrwl based packages
              let version: string;
              // ensure inner schematic dependencies are installed
              for (const name of packageInnerDependencies[packageName]) {
                if (name.indexOf('nrwl') > -1) {
                  // default to internally managed/supported nrwl version
                  version = nxVersion;
                  // look for existing nrwl versions if user already has them installed and use those
                  if (
                    packageJson.dependencies &&
                    packageJson.dependencies[name]
                  ) {
                    version = packageJson.dependencies[name];
                  } else if (
                    packageJson.devDependencies &&
                    packageJson.devDependencies[name]
                  ) {
                    version = packageJson.devDependencies[name];
                  }
                  devDependencies[name] = version;
                } else {
                  devDependencies[name] = xplatVersion;
                }
              }
            }
          }
        }
        // console.log(devDependencies);

        return XplatHelpers.updatePackageForXplat(options, {
          devDependencies,
        })(tree, context);
      });
    }

    if (options.isTesting) {
      // necessary to unit test the appropriately
      if (xplatPlatforms) {
        externalChains.push(
          externalSchematic('@nstudio/xplat', 'app-generate', options, {
            interactive: false,
          })
        );
      }

      if (packagesToRun.length) {
        for (const packageName of packagesToRun) {
          const nxPlatform = <PlatformWithNxTypes>(
            packageName.replace('@nrwl/', '')
          );
          const { name, directory } = getAppNamingConvention(
            options,
            nxPlatform
          );
          output.log({
            title: 'Note:',
            bodyLines: [noXplatLayerNote(nxPlatform)],
          });

          externalChains.push(
            externalSchematic(
              packageName,
              generator,
              {
                ...options,
                name,
                directory,
              },
              {
                interactive: false,
              }
            )
          );
        }
      }
    } else {
      if (xplatPlatforms) {
        externalChains.push(
          externalSchematic('@nstudio/xplat', 'app-generate', options)
        );
      }
      if (packagesToRun.length) {
        externalChains.push((tree: Tree, context: SchematicContext) => {
          const installPackageTask = context.addTask(
            new NodePackageInstallTask()
          );

          // console.log('devDependencies:', devDependencies);
          // console.log('packagesToRunXplat:', packagesToRunXplat);
          for (const packageName of packagesToRun) {
            const nxPlatform = <PlatformWithNxTypes>(
              packageName.replace('@nrwl/', '')
            );
            const { name, directory } = getAppNamingConvention(
              options,
              nxPlatform
            );
            output.log({
              title: 'Note:',
              bodyLines: [noXplatLayerNote(nxPlatform)],
            });
            context.addTask(
              new RunSchematicTask(packageName, generator, {
                ...options,
                name,
                directory,
              }),
              [installPackageTask]
            );
          }
        });
      }
    }
    return externalChains;
  }

  export function applyAppNamingConvention(
    options: any,
    platform: PlatformWithNxTypes
  ): Rule {
    return (tree: Tree, context: SchematicContext) => {
      const { name, directory } = getAppNamingConvention(options, platform);
      options.name = name;
      options.directory = directory;
      // console.log('applyAppNamingConvention:', options);
      // adjusted name, nothing else to do
      return noop()(tree, context);
    };
  }

  export function getAppNamingConvention(
    options: any,
    platform: PlatformWithNxTypes
  ) {
    let name = '';
    let directory = '';
    if (options.directory) {
      directory = toFileName(options.directory);
      if (
        directory === platform &&
        supportedPlatformsWithNx.includes(<PlatformWithNxTypes>directory)
      ) {
        name = toFileName(options.name);
      } else {
        name = getPlatformName(options.name, platform);
      }
    } else {
      name = getPlatformName(options.name, platform);
    }
    return {
      name,
      directory,
    };
  }

  export function addPlatformFiles(options: Schema, platform: string) {
    return (tree: Tree, context: SchematicContext) => {
      let frontendFramework: FrameworkTypes = getFrontendFramework();
      if (tree.exists(`xplat/${platform}/index.ts`)) {
        // check if framework had been set
        frontendFramework = getFrontendFramework();
        // console.log('addPlatformFiles frontendFramework:', frontendFramework)
        // console.log('addPlatformFiles options.framework:', options.framework)
        if (frontendFramework && !options.framework) {
          // User is attempting to add xplat support for platform they added previously paired with a framework
          // base platform support: platform without framework integrations
          // ie: vanilla {N}, vanilla web, vanilla ionic, etc. (without angular, react, vue, etc.)
          // if user had set a default framework and is now attempting to generate base platform support
          // TODO: add schematic to reconfigure workspace to rename xplat folders to support full multi-framework setup
          throw new SchematicsException(
            noteAboutXplatSetupWithFramework(frontendFramework, platform)
          );
        }
        // already added
        return noop();
      }

      const xplatFolderName = XplatHelpers.getXplatFoldername(
        <PlatformTypes>platform,
        <FrameworkTypes>options.framework
      );

      return branchAndMerge(
        mergeWith(
          apply(url(`./_files`), [
            template({
              ...(options as any),
              ...getDefaultTemplateOptions(),
              xplatFolderName,
            }),
            move(`xplat/${xplatFolderName}`),
          ])
        )
      );
    };
  }

  export function updatePackageForXplat(
    options: Schema,
    updates: {
      dependencies?: { [key: string]: string };
      devDependencies?: { [key: string]: string };
    }
  ) {
    return (tree: Tree, context: SchematicContext) => {
      const packagePath = 'package.json';
      let packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        // could introduce xplat.json but trying to avoid too much extra overhead so just store in package.json for now
        // can migrate this later if decide enough settings for xplat.json
        // prefix is important because shared code is setup with a prefix to begin with which should be known and used for all subsequent apps which are generated

        const xplatSettings: IXplatSettings = getUpdatedXplatSettings(options);

        if (!updates && xplatSettings) {
          // just updating xplat internal settings
          packageJson.xplat = {
            ...(packageJson.xplat || {}),
            ...xplatSettings,
          };
          // just update xplat workspace settings
          return updateJsonFile(tree, packagePath, packageJson);
        } else if (updates) {
          // update root dependencies for the generated xplat support
          packageJson = {
            ...packageJson,
            dependencies: {
              ...(packageJson.dependencies || {}),
              ...(updates.dependencies || {}),
            },
            devDependencies: {
              ...(packageJson.devDependencies || {}),
              ...(updates.devDependencies || {}),
            },
            xplat: {
              ...(packageJson.xplat || {}),
              ...xplatSettings,
            },
          };
          // console.log('updatePackageForXplat:', serializeJson(packageJson));
          return updateJsonFile(tree, packagePath, packageJson);
        }
      }
      return tree;
    };
  }

  export function updateGitIgnore() {
    return (tree: Tree) => {
      const gitIgnorePath = '.gitignore';
      let gitIgnore = tree.get(gitIgnorePath).content.toString();
      if (gitIgnore) {
        if (gitIgnore.indexOf('libs/**/*.js') === -1) {
          gitIgnore += `
# libs
libs/**/*.js
libs/**/*.map
libs/**/*.d.ts
libs/**/*.metadata.json
libs/**/*.ngfactory.ts
libs/**/*.ngsummary.json
      `;
        }
        if (gitIgnore.indexOf('xplat/**/*.js') === -1) {
          gitIgnore += `
# xplat
xplat/**/*.js
xplat/**/*.map
xplat/**/*.d.ts
xplat/**/*.metadata.json
xplat/**/*.ngfactory.ts
xplat/**/*.ngsummary.json
      `;
        }
      }

      return updateFile(tree, gitIgnorePath, gitIgnore);
    };
  }

  export function updateTsConfigPaths(
    options: Schema,
    settings?: {
      framework?: FrameworkTypes;
      dependentPlatforms?: Array<PlatformTypes>;
    }
  ) {
    return (tree: Tree) => {
      const nxJson = getNxWorkspaceConfig(tree);
      const npmScope = nxJson.npmScope;
      const platformArg = options.platforms;
      // sort for consistency
      const platforms = (<Array<PlatformTypes>>(
        (<unknown>sanitizeCommaDelimitedArg(platformArg))
      )).sort(function (a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      const frontendFramework = getFrontendFramework();
      let frameworkSuffix: string = '';

      if (settings) {
        if (settings.framework !== frontendFramework) {
          // when users have a default framework set, generation allows name to not include the default framework of choice
          frameworkSuffix = `-${settings.framework}`;
        }
        if (settings.dependentPlatforms) {
          for (const dependentPlatform of settings.dependentPlatforms) {
            if (!platforms.includes(dependentPlatform)) {
              // ensure dependent platform is added since these platforms depend on it
              platforms.push(dependentPlatform);
            }
          }
        }
      }

      const updates: any = {};
      // ensure default Nx libs path is in place
      updates[`@${npmScope}/*`] = [`libs/*`];
      for (const t of platforms) {
        updates[`@${npmScope}/${t}${frameworkSuffix}`] = [
          `xplat/${t}${frameworkSuffix}/index.ts`,
        ];
        updates[`@${npmScope}/${t}${frameworkSuffix}/*`] = [
          `xplat/${t}${frameworkSuffix}/*`,
        ];
      }

      return updateTsConfig(tree, (tsConfig: any) => {
        if (tsConfig) {
          if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
          }
          tsConfig.compilerOptions.paths = {
            ...(tsConfig.compilerOptions.paths || {}),
            ...updates,
          };
        }
      });
    };
  }

  export function updatePrettierIgnore(content: string, checkExisting: string) {
    return (tree: Tree) => {
      const prettierFileName = '.prettierignore';
      if (tree.exists(prettierFileName)) {
        let prettier = tree.read(prettierFileName)!.toString('utf-8');
        if (prettier && prettier.indexOf(checkExisting) === -1) {
          // update prettier rules
          prettier = `${prettier}\n${content}`;

          // output.log({
          //   title: 'Note:',
          //   bodyLines: [
          //     `Updating "${prettierFileName}" with a few important extra rules. You may double-check the contents afterwards to ensure they meet your satisfaction.`
          //   ]
          // });

          tree.overwrite(prettierFileName, prettier);
        }
      }
      return tree;
    };
  }

  export function addPackageInstallTask(options: Schema) {
    return (tree: Tree, context: SchematicContext) => {
      // let packageTask;
      if (!options.skipInstall) {
        // packageTask = context.addTask(
        //   new NodePackageInstallTask() //options.directory)
        // );
        context.addTask(new NodePackageInstallTask());
      }
    };
  }
}

export namespace XplatComponentHelpers {
  export interface Schema {
    name: string;
    /**
     * Target feature. Default is 'ui' if none specified.
     */
    feature?: string;
    /**
     * Group it in a subfolder of the target feature
     */
    subFolder?: string;
    /**
     * Target apps
     */
    projects?: string;
    /**
     * Only generate for specified projects and ignore shared code
     */
    onlyProject?: boolean;
    /**
     * Target platforms
     */
    platforms?: string;
    framework?: string;
    /**
     * Create a base component for maximum cross platform sharing
     */
    createBase?: boolean;
    /**
     * Schematic processing helpers
     */
    needsIndex?: boolean;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export function prepare(
    options: Schema
  ): XplatHelpers.IXplatGeneratorOptions {
    if (!options.name) {
      throw new Error(generateOptionError('component'));
    }

    // reset module globals
    options.needsIndex = false;
    let featureName: string;
    let projectNames = null;
    let platforms = [];

    if (options.feature) {
      featureName = options.feature.toLowerCase();
    }
    const projects = options.projects;
    if (projects) {
      options.onlyProject = true;
      if (!featureName) {
        // no feature targeted, default to shared
        featureName = 'shared';
      }
      // building feature in shared code and in projects
      projectNames = sanitizeCommaDelimitedArg(projects);
      for (const name of projectNames) {
        const projectParts = name.split('-');
        const platPrefix = projectParts[0];
        const platSuffix = projectParts.pop();
        if (
          supportedPlatforms.includes(platPrefix) &&
          !platforms.includes(platPrefix)
        ) {
          // if project name is prefixed with supported platform and not already added
          platforms.push(platPrefix);
        } else if (
          supportedPlatforms.includes(platSuffix) &&
          !platforms.includes(platSuffix)
        ) {
          platforms.push(platSuffix);
        }
      }
    } else if (options.platforms) {
      if (!featureName) {
        // no feature targeted, default to ui
        featureName = 'ui';
      }
      // building feature in shared code only
      platforms = sanitizeCommaDelimitedArg(options.platforms);
    }
    if (platforms.length === 0) {
      let error = projects
        ? platformAppPrefixError()
        : generatorError('component');
      throw new Error(optionsMissingError(error));
    }
    return { featureName, projectNames, platforms };
  }
}

export namespace XplatFeatureHelpers {
  export interface Schema {
    name: string;
    /**
     * Target apps
     */
    projects?: string;
    /**
     * Target platforms
     */
    platforms?: string;
    framework?: string;
    /**
     * Only generate for specified projects and ignore shared code
     */
    onlyProject?: boolean;
    /**
     * Only generate the module and ignore default component creation
     */
    onlyModule?: boolean;
    /**
     * Configure routing
     */
    routing?: boolean;
    /**
     * Create base component for maximum code sharing
     */
    createBase?: boolean;
    /**
     * Add link to route for sandbox
     */
    adjustSandbox?: boolean;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export function prepare(
    options: Schema
  ): XplatHelpers.IXplatGeneratorOptions {
    if (!options.name) {
      throw new SchematicsException(
        `You did not specify the name of the feature you'd like to generate. For example: nx g @nstudio/angular:feature my-feature`
      );
    }
    const featureName = options.name.toLowerCase();
    let projects = options.projects;
    let projectNames: Array<string>;
    let platforms = [];
    if (options.adjustSandbox) {
      // when adjusting sandbox for the feature, turn dependent options on
      // for convenience also setup some default fallbacks to avoid requiring so many options
      // sandbox flags are meant to be quick and convenient
      options.onlyProject = true;
      options.routing = true;
      if (!projects) {
        if (!options.platforms) {
          // default to {N} sandbox
          projects = 'nativescript-sandbox';
        } else {
          platforms = sanitizeCommaDelimitedArg(options.platforms);
          const projectSandboxNames = [];
          // default to project with sandbox name
          for (const p of platforms) {
            if (supportedSandboxPlatforms.includes(p)) {
              projectSandboxNames.push(`${p}-sandbox`);
            } else {
              throw new SchematicsException(
                `The --adjustSandbox flag supports the following at the moment: ${supportedSandboxPlatforms}`
              );
            }
          }
          projects = projectSandboxNames.join(',');
        }
      }
    }
    if (options.routing && !options.onlyProject) {
      throw new SchematicsException(
        `When generating a feature with the --routing option, please also specify --onlyProject. Support for shared code routing is under development.`
      );
    }

    if (projects) {
      // building feature in shared code and in projects
      projectNames = sanitizeCommaDelimitedArg(projects);
      for (const name of projectNames) {
        let projectName = name;
        if (name.indexOf('/') > -1) {
          projectName = name.split('/').pop();
        }
        const projectParts = projectName.split('-');
        const platPrefix = <PlatformTypes>projectParts[0];
        const platSuffix = <PlatformTypes>projectParts.pop();
        if (
          supportedPlatforms.includes(platPrefix) &&
          !platforms.includes(platPrefix)
        ) {
          // if project name is prefixed with supported platform and not already added
          platforms.push(platPrefix);
        } else if (
          supportedPlatforms.includes(platSuffix) &&
          !platforms.includes(platSuffix)
        ) {
          // if project name is suffixed with supported platform and not already added
          platforms.push(platSuffix);
        }
      }
    } else if (options.platforms) {
      // building feature in shared code only
      platforms = sanitizeCommaDelimitedArg(options.platforms);
    }
    if (platforms.length === 0 && !options.onlyModule) {
      let error = projects
        ? platformAppPrefixError()
        : generatorError('feature');
      throw new SchematicsException(optionsMissingError(error));
    }
    return { featureName, projectNames, platforms };
  }

  export function addFiles(
    options: Schema,
    target: string = '',
    projectName: string = '',
    extra: string = '',
    framework?: FrameworkTypes
  ) {
    let moveTo: string;
    if (target) {
      moveTo = getMoveTo(options, target, projectName, framework);
    } else {
      target = 'lib';
      moveTo = `libs/features/${options.name.toLowerCase()}`;
    }
    if (!extra) {
      // make sure no `null` or `undefined` values get in the string path
      extra = '';
    }
    // console.log('target:', target);
    // console.log('addFiles moveTo:', moveTo);
    // console.log('add files from:', `${workingDirectory}/${extra}_files`);
    return branchAndMerge(
      mergeWith(
        apply(url(`./${extra}_files`), [
          template(getTemplateOptions(options, target, framework)),
          move(moveTo),
        ])
      )
    );
  }

  export function adjustBarrelIndex(
    options: Schema,
    indexFilePath: string
  ): Rule {
    return (tree: Tree) => {
      // console.log('adjustBarrelIndex indexFilePath:', indexFilePath);
      // console.log('tree.exists(indexFilePath):', tree.exists(indexFilePath));
      const indexSource = tree.read(indexFilePath)!.toString('utf-8');
      const indexSourceFile = createSourceFile(
        indexFilePath,
        indexSource,
        ScriptTarget.Latest,
        true
      );

      insert(tree, indexFilePath, [
        ...addGlobal(
          indexSourceFile,
          indexFilePath,
          `export * from './${options.name.toLowerCase()}';`,
          true
        ),
      ]);
      return tree;
    };
  }

  export function getTemplateOptions(
    options: Schema,
    platform: string,
    framework?: FrameworkTypes
  ) {
    const nameParts = options.name.split('-');
    let endingDashName = nameParts[0];
    if (nameParts.length > 1) {
      endingDashName = stringUtils.capitalize(nameParts[nameParts.length - 1]);
    }
    const xplatFolderName = XplatHelpers.getXplatFoldername(
      <PlatformTypes>platform,
      framework
    );
    return {
      ...(options as any),
      ...getDefaultTemplateOptions(),
      name: options.name.toLowerCase(),
      endingDashName,
      xplatFolderName,
    };
  }

  export function getMoveTo(
    options: Schema,
    platform: string,
    projectName?: string,
    framework?: FrameworkTypes
  ) {
    // console.log('getMoveTo framework:', framework);
    const xplatFolderName = XplatHelpers.getXplatFoldername(
      <PlatformTypes>platform,
      framework
    );
    // console.log('getMoveTo xplatFolderName:', xplatFolderName);
    const featureName = options.name.toLowerCase();
    let moveTo = `xplat/${xplatFolderName}/features/${featureName}`;
    if (projectName) {
      let appDir = ['web', 'web-angular'].includes(xplatFolderName)
        ? '/app'
        : '';
      moveTo = `apps/${projectName}/src${appDir}/features/${featureName}`;
      // console.log('moveTo:', moveTo);
    }
    return moveTo;
  }
}
