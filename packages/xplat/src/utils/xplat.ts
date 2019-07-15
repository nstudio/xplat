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
  externalSchematic
} from '@angular-devkit/schematics';
import { createSourceFile, ScriptTarget } from 'typescript';
import {
  getDefaultTemplateOptions,
  getPrefix,
  updateJsonFile,
  getJsonFromFile,
  stringUtils,
  PlatformTypes,
  supportedSandboxPlatforms,
  supportedPlatforms,
  getGroupByName,
  sanitizeCommaDelimitedArg,
  updateFile,
  updateTsConfig,
  getNxWorkspaceConfig,
  PlatformModes,
  isTesting,
  jsonParse,
  FrameworkTypes,
  getDefaultFramework,
  IXplatSettings
} from './general';
import {
  updateJsonInTree,
  toFileName,
  serializeJson,
  readJsonInTree
} from '@nrwl/workspace';
import { insert, addGlobal } from './ast';
import {
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  noPlatformError,
  unsupportedPlatformError
} from './errors';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

export const packageInnerDependencies = {
  '@nstudio/angular': ['@nrwl/angular'],
  '@nstudio/electron-angular': ['@nstudio/electron', '@nstudio/angular'],
  '@nstudio/ionic-angular': ["@nstudio/ionic", "@nstudio/angular"],
  '@nstudio/nativescript-angular': ["@nstudio/nativescript", "@nstudio/angular"],
  '@nstudio/web-angular': ["@nstudio/web", "@nstudio/angular"]
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
     * Set options as default
     * Used to set specified framework as primary
     */
    setDefault?: boolean;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
    /**
     * Skip dependent platform files
     */
    skipDependentPlatformFiles?: boolean;
    /**
     * Skip install
     */
    skipInstall?: boolean;
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
              interactive: false
            })
          : noop()
        : externalSchematic(packageName, 'ng-add', options, {
            interactive: false
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

  /**
   * Returns a name with the platform.
   *
   * @example (app, web) => web-app or app-web
   * @param name
   * @param platform
   */
  export function getPlatformName(name: string, platform: PlatformTypes) {
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
  export function getXplatFoldername(platform: PlatformTypes, framework?: FrameworkTypes) {
    const defaultFramework = getDefaultFramework();
    // console.log('defaultFramework:', defaultFramework);
    let frameworkSuffix = '';
    if (framework && defaultFramework !== framework) {
      // use suffix to distinguish
      frameworkSuffix = `-${framework}`;
    }
    return `${platform}${frameworkSuffix}`;
  }

  export function applyAppNamingConvention(
    options: any,
    platform: PlatformTypes
  ) {
    return (tree: Tree, context: SchematicContext) => {
      options.name = getPlatformName(options.name, platform);
      // console.log('applyAppNamingConvention:', options);
      // if command line argument, make sure it's persisted to xplat settings
      if (options.groupByName) {
        return updatePackageForXplat(options, null, {
          groupByName: true
        })(tree, context);
      } else {
        // adjusted name, nothing else to do
        return noop()(tree, context);
      }
    };
  }

  export function addPlatformFiles(options: Schema, platform: string) {
    return (tree: Tree, context: SchematicContext) => {
      if (tree.exists(`xplat/${platform}/core/index.ts`)) {
        // already added
        return noop();
      }

      return branchAndMerge(
        mergeWith(
          apply(url(`./_files`), [
            template({
              ...(options as any),
              ...getDefaultTemplateOptions()
            }),
            move(`xplat/${platform}`)
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
    },
    // used to update various xplat workspace settings
    // can be used in combination with other generators to adjust settings
    updatedXplatSettings?: IXplatSettings
  ) {
    return (tree: Tree, context: SchematicContext) => {
      const packagePath = 'package.json';
      let packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        // could introduce xplat.json but trying to avoid too much extra overhead so just store in package.json for now
        // can migrate this later if decide enough settings for xplat.json
        // prefix is important because shared code is setup with a prefix to begin with which should be known and used for all subsequent apps which are generated

        if (!updates && updatedXplatSettings) {
          // just updating xplat internal settings
          packageJson.xplat = {
            ...packageJson.xplat,
            ...updatedXplatSettings
          };
          // just update xplat workspace settings
          return updateJsonFile(tree, packagePath, packageJson);
        } else if (updates) {
          // update root dependencies for the generated xplat support
          packageJson = {
            ...packageJson,
            dependencies: {
              ...(packageJson.dependencies || {}),
              ...(updates.dependencies || {})
            },
            devDependencies: {
              ...(packageJson.devDependencies || {}),
              ...(updates.devDependencies || {})
            },
            xplat: {
              prefix: getPrefix(),
              ...(updatedXplatSettings || {})
            }
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
      )).sort(function(a, b) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      });
      const defaultFramework = getDefaultFramework();
      let frameworkSuffix: string = ''; 
      // defaultFramework
      //   ? `-${defaultFramework}`
      //   : '';

      if (settings) {
        if (settings.framework !== defaultFramework) {
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
        if (supportedPlatforms.includes(t)) {
          updates[`@${npmScope}/${t}${frameworkSuffix}`] = [
            `xplat/${t}${frameworkSuffix}/index.ts`
          ];
          updates[`@${npmScope}/${t}${frameworkSuffix}/*`] = [
            `xplat/${t}${frameworkSuffix}/*`
          ];
        } else {
          throw new Error(
            `${t} is not a supported platform. Currently supported: ${supportedPlatforms}`
          );
        }
      }

      return updateTsConfig(tree, (tsConfig: any) => {
        if (tsConfig) {
          if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
          }
          tsConfig.compilerOptions.paths = {
            ...(tsConfig.compilerOptions.paths || {}),
            ...updates
          };
        }
      });
    };
  }

  export function updateIDESettings(
    options: Schema,
    devMode?: PlatformModes,
    allApps?: string[],
    focusOnApps?: string[]
  ) {
    return (tree: Tree, context: SchematicContext) => {
      if (isTesting()) {
        // ignore node file modifications when just testing
        return tree;
      }

      try {
        const cwd = process.cwd();
        // console.log('workspace dir:', process.cwd());
        // const dirName = cwd.split('/').slice(-1);
        const groupByName = getGroupByName();
        const defaultFramework = getDefaultFramework();
        let frameworkSuffix: string = defaultFramework
          ? `-${defaultFramework}`
          : '';

        let isFullstack = false;
        let isExcluding = false;
        let appWildcards = [];
        const userUpdates: any = {};
        if (!devMode || devMode === 'fullstack') {
          // show all
          isFullstack = true;
          for (const p of supportedPlatforms) {
            const appFilter = groupByName ? `*-${p}` : `${p}-*`;
            userUpdates[`**/apps/${appFilter}`] = false;
            userUpdates[`**/xplat/${p}`] = false;
            if (frameworkSuffix) {
              userUpdates[`**/xplat/${p}${frameworkSuffix}`] = false;
            }
          }
        } else if (options.platforms) {
          const platforms = sanitizeCommaDelimitedArg(options.platforms);
          // switch on/off platforms
          for (const p of supportedPlatforms) {
            const excluded = platforms.includes(p) ? false : true;
            const appFilter = groupByName ? `*-${p}` : `${p}-*`;
            if (focusOnApps.length) {
              // focusing on apps
              // fill up wildcards to use below (we will clear all app wildcards when focusing on apps)
              appWildcards.push(`**/apps/${appFilter}`);
            } else {
              // use wildcards for apps only if no project names were specified
              userUpdates[`**/apps/${appFilter}`] = excluded;
            }
            userUpdates[`**/xplat/${p}`] = excluded;
            if (frameworkSuffix) {
              userUpdates[`**/xplat/${p}${frameworkSuffix}`] = excluded;
            }

            if (excluded) {
              // if excluding any platform at all, set the flag
              // this is used for WebStorm support below
              isExcluding = true;
            }
          }
        }

        const isMac = process.platform == 'darwin';

        // VS Code support
        // const homedir = os.homedir();
        // console.log('os.homedir():',homedir);
        let userSettingsVSCodePath = isMac
          ? process.env.HOME +
            `/Library/Application Support/Code/User/settings.json`
          : '/var/local/Code/User/settings.json';
        const windowsHome = process.env.APPDATA;
        if (windowsHome) {
          userSettingsVSCodePath = join(
            windowsHome,
            'Code',
            'User',
            'settings.json'
          );
        }
        // console.log('userSettingsVSCodePath:',userSettingsVSCodePath);
        const isVsCode = existsSync(userSettingsVSCodePath);
        let vscodeCreateSettingsNote = `It's possible you don't have a user settings.json yet. If so, open VS Code User settings and save any kind of setting to have it created.`;
        // console.log('isVsCode:',isVsCode);
        if (isVsCode) {
          const userSettings = readFileSync(userSettingsVSCodePath, 'UTF-8');
          if (userSettings) {
            const userSettingsJson = jsonParse(userSettings);
            let exclude = userSettingsJson['files.exclude'];
            if (!exclude) {
              exclude = {};
            }
            let searchExclude = userSettingsJson['search.exclude'];
            if (!searchExclude) {
              searchExclude = {};
            }

            userSettingsJson['files.exclude'] = Object.assign(
              exclude,
              userUpdates
            );
            userSettingsJson['search.exclude'] = Object.assign(
              searchExclude,
              userUpdates
            );

            if (allApps.length) {
              // always reset specific app filters
              for (const app of allApps) {
                delete userSettingsJson['files.exclude'][app];
                delete userSettingsJson['search.exclude'][app];
              }
            }
            if (!isFullstack && focusOnApps.length && allApps.length) {
              // when focusing on projects, clear all specific app wildcards first if they exist
              for (const wildcard of appWildcards) {
                delete userSettingsJson['files.exclude'][wildcard];
                delete userSettingsJson['search.exclude'][wildcard];
              }
              for (const focusApp of focusOnApps) {
                userSettingsJson['files.exclude'][focusApp] = false;
                userSettingsJson['search.exclude'][focusApp] = false;
              }
              // ensure all other apps are excluded (except for the one that's being focused on)
              for (const app of allApps) {
                if (!focusOnApps.includes(app)) {
                  userSettingsJson['files.exclude'][app] = true;
                  userSettingsJson['search.exclude'][app] = true;
                }
              }
            }

            writeFileSync(
              userSettingsVSCodePath,
              serializeJson(userSettingsJson)
            );
          } else {
            console.warn(
              `Warning: xplat could not read your VS Code settings.json file therefore development mode has not been set. ${vscodeCreateSettingsNote}`
            );
          }
        } else {
          console.log(
            `Note to VS Code users: no development mode set. xplat could not find any VS Code settings in the standard location: ${userSettingsVSCodePath} ${vscodeCreateSettingsNote}`
          );
        }

        // WebStorm support
        let isWebStorm = false;
        // list preferences to get correct webstorm prefs file
        // let preferencesFolder = isMac
        //   ? process.env.HOME +
        //     `/Library/Preferences`
        //   : __dirname;
        // if (windowsHome) {
        //   preferencesFolder = windowsHome;
        // }
        // const prefs = fs.readdirSync(preferencesFolder).filter(f => fs.statSync(join(preferencesFolder, f)).isDirectory());
        // find first one
        // TODO: user may have multiple version installed (or at least older versions) so may need to handle if multiples
        // let webStormPrefFolderName = prefs.find(f => f.indexOf('WebStorm20') > -1);
        // if (webStormPrefFolderName) {
        //   isWebStorm = true;
        //   webStormPrefFolderName = webStormPrefFolderName.split('/').slice(-1)[0];
        //   // console.log('webStormPrefFolderName:',webStormPrefFolderName);

        //   // ensure folders are excluded from project view
        //   let projectViewWebStormPath =
        //     isMac
        //       ? process.env.HOME +
        //         `/Library/Preferences/${webStormPrefFolderName}/options/projectView.xml`
        //       : join(__dirname, webStormPrefFolderName, 'config');
        //   if (windowsHome) {
        //     projectViewWebStormPath = join(windowsHome, webStormPrefFolderName, 'config');
        //   }

        //   let projectView = fs.readFileSync(projectViewWebStormPath, "UTF-8");
        //   if (projectView) {
        //     // console.log('projectView:', projectView);
        //     xml2js.parseString(projectView, (err, settings) => {
        //       // console.log(util.inspect(settings, false, null));
        //       if (settings && settings.application && settings.application.component && settings.application.component.length) {
        //         const builder = new xml2js.Builder({ headless: true });

        //         const sharedSettingsIndex = (<Array<any>>settings.application.component).findIndex(c => c.$.name === 'ProjectViewSharedSettings');
        //         if (sharedSettingsIndex > -1) {
        //           const sharedSettings = settings.application.component[sharedSettingsIndex];
        //           if (sharedSettings.option && sharedSettings.option.length) {
        //             const showExcludedFilesIndex = sharedSettings.option.findIndex(o => o.$.name === 'showExcludedFiles');
        //             if (showExcludedFilesIndex > -1) {
        //               settings.application.component[sharedSettingsIndex].option[showExcludedFilesIndex].$.value = `${!isExcluding}`;
        //             } else {
        //               settings.application.component[sharedSettingsIndex].option.push(webStormExcludedViewNode(isExcluding));
        //             }
        //           } else {
        //             settings.application.component[sharedSettingsIndex].option = [
        //               webStormExcludedViewNode(isExcluding)
        //             ];
        //           }
        //           settings = builder.buildObject(settings);
        //         } else {
        //           (<Array<any>>settings.application.component).push({
        //             $: 'ProjectViewSharedSettings',
        //             option: [
        //               webStormExcludedViewNode(isExcluding)
        //             ]
        //           });
        //           settings = builder.buildObject(settings);
        //         }
        //       } else {
        //         // create projectView.xml
        //         settings = createWebStormProjectView(isExcluding);
        //       }
        //       // modify projectView
        //       // console.log('settings:', settings);
        //       fs.writeFileSync(
        //         projectViewWebStormPath,
        //         settings
        //       );
        //     });
        //   } else {
        //     // create projectView.xml
        //     fs.writeFileSync(
        //       projectViewWebStormPath,
        //       createWebStormProjectView(isExcluding)
        //     );
        //   }
        // }

        if (!devMode) {
          // only when not specifying a dev mode
          const workspaceUpdates: any = {
            '**/node_modules': true,
            '**/hooks': true,
            '**/apps/nativescript-*/app/package.json': false,
            '**/apps/nativescript-*/hooks': true,
            '**/apps/nativescript-*/platforms': true,
            '**/apps/nativescript-*/report': true,
            '**/apps/nativescript-*/app/**/*.js': {
              when: '$(basename).ts'
            },
            '**/apps/nativescript-*/app/**/*.d.ts': {
              when: '$(basename).ts'
            },
            '**/apps/nativescript-*/app/**/*.css': {
              when: '$(basename).scss'
            },
            // also add groupByName support
            '**/apps/*-nativescript/app/package.json': false,
            '**/apps/*-nativescript/hooks': true,
            '**/apps/*-nativescript/platforms': true,
            '**/apps/*-nativescript/report': true,
            '**/apps/*-nativescript/app/**/*.js': {
              when: '$(basename).ts'
            },
            '**/apps/*-nativescript/app/**/*.d.ts': {
              when: '$(basename).ts'
            },
            '**/apps/*-nativescript/app/**/*.css': {
              when: '$(basename).scss'
            },
            // libs/xplat
            '**/libs/**/*.js': {
              when: '$(basename).ts'
            },
            '**/libs/**/*.d.ts': {
              when: '$(basename).ts'
            },
            '**/xplat/**/*.js': {
              when: '$(basename).ts'
            },
            '**/xplat/**/*.d.ts': {
              when: '$(basename).ts'
            }
          };

          if (isVsCode) {
            const workspaceSettingsPath = join(cwd, '.vscode', 'settings.json');
            // console.log('workspaceSettingsPath:',workspaceSettingsPath);
            let workspaceSettingsJson: any = {};
            if (existsSync(workspaceSettingsPath)) {
              const workspaceSettings = readFileSync(
                workspaceSettingsPath,
                'UTF-8'
              );
              workspaceSettingsJson = jsonParse(workspaceSettings);
              const exclude = workspaceSettingsJson['files.exclude'];
              workspaceSettingsJson['files.exclude'] = Object.assign(
                exclude,
                workspaceUpdates
              );
            } else {
              // console.log('creating workspace settings...');
              mkdirSync('.vscode');
              workspaceSettingsJson['files.exclude'] = workspaceUpdates;
            }
            writeFileSync(
              workspaceSettingsPath,
              serializeJson(workspaceSettingsJson)
            );
          }

          if (isWebStorm) {
          }
        }
      } catch (err) {
        // console.warn('IDE Settings could not be updated at this time:', err);
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
