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
  SchematicsException
} from '@angular-devkit/schematics';
import { PlatformModes, isTesting, getGroupByName, getFrontendFramework, supportedPlatformsWithNx, sanitizeCommaDelimitedArg, jsonParse } from '@nstudio/xplat-utils';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { serializeJson } from '@nrwl/workspace';
const xml2js = require('xml2js');

export namespace FocusHelpers {
  export function updateIDESettings(
    options: {
      platforms?: string
    },
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
        // console.log('workspace dir:', process.cwd());
        // const dirName = process.cwd().split('/').slice(-1);
        const groupByName = getGroupByName();
        const framework = getFrontendFramework();
        let frameworkSuffix: string = framework ? `-${framework}` : '';

        let isFullstack = false;
        let isExcluding = false;
        let appWildcards: Array<string> = [];
        const userUpdates: any = {};
        if (!devMode || devMode === 'fullstack') {
          // show all
          isFullstack = true;
          for (const p of supportedPlatformsWithNx) {
            const appFilter = groupByName ? `*-${p}` : `${p}*`;
            userUpdates[`**/apps/${appFilter}`] = false;
            userUpdates[`**/xplat/${p}`] = false;
            if (frameworkSuffix) {
              userUpdates[`**/xplat/${p}${frameworkSuffix}`] = false;
            }
          }
        } else if (options.platforms) {
          const platforms = sanitizeCommaDelimitedArg(options.platforms);
          // switch on/off platforms
          for (const p of supportedPlatformsWithNx) {
            const excluded = platforms.includes(p) ? false : true;
            const appFilter = groupByName ? `*-${p}` : `${p}*`;
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

        // always ensure hidden xplat files are hidden from view
        userUpdates['**/xplat/*/.xplatframework'] = true;

        // VS Code
        const isVsCode = updateVSCode({
          userUpdates,
          allApps,
          focusOnApps,
          appWildcards,
          isFullstack
        });

        // WebStorm
        let isWebStorm = updateWebStorem({
          userUpdates,
          allApps,
          focusOnApps,
          appWildcards,
          isFullstack
        });

        if (!devMode) {
          // only when not specifying a dev mode
          const workspaceUpdates: any = {
            '**/node_modules': true,
            '**/hooks': true,
            // '**/apps/nativescript-*/src/package.json': false,
            '**/apps/nativescript-*/hooks': true,
            '**/apps/nativescript-*/platforms': true,
            '**/apps/nativescript-*/report': true,
            '**/apps/nativescript-*/src/**/*.js': {
              when: '$(basename).ts'
            },
            '**/apps/nativescript-*/src/**/*.d.ts': {
              when: '$(basename).ts'
            },
            '**/apps/nativescript-*/src/**/*.css': {
              when: '$(basename).scss'
            },
            // also add groupByName support
            // '**/apps/*-nativescript/src/package.json': false,
            '**/apps/*-nativescript/hooks': true,
            '**/apps/*-nativescript/platforms': true,
            '**/apps/*-nativescript/report': true,
            '**/apps/*-nativescript/app/**/*.js': {
              when: '$(basename).ts'
            },
            '**/apps/*-nativescript/src/**/*.d.ts': {
              when: '$(basename).ts'
            },
            '**/apps/*-nativescript/src/**/*.css': {
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
            updateVSCode({
              workspaceUpdates
            });
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

  export function updateVSCode(options: {
    userUpdates?: any;
    workspaceUpdates?: any;
    allApps?: string[];
    focusOnApps?: string[];
    appWildcards?: string[];
    isFullstack?: boolean;
  }) {
    // VS Code support
    let isVsCode: boolean;
    const isMac = process.platform == 'darwin';

    if (options.userUpdates) {
      /**
       * User settings
       */
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
      isVsCode = existsSync(userSettingsVSCodePath);
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
            options.userUpdates
          );
          userSettingsJson['search.exclude'] = Object.assign(
            searchExclude,
            options.userUpdates
          );

          if (options.allApps.length) {
            // always reset specific app filters
            for (const app of options.allApps) {
              delete userSettingsJson['files.exclude'][app];
              delete userSettingsJson['search.exclude'][app];
            }
          }
          if (
            !options.isFullstack &&
            options.focusOnApps.length &&
            options.allApps.length
          ) {
            // when focusing on projects, clear all specific app wildcards first if they exist
            for (const wildcard of options.appWildcards) {
              delete userSettingsJson['files.exclude'][wildcard];
              delete userSettingsJson['search.exclude'][wildcard];
            }
            for (const focusApp of options.focusOnApps) {
              userSettingsJson['files.exclude'][focusApp] = false;
              userSettingsJson['search.exclude'][focusApp] = false;
            }
            // ensure all other apps are excluded (except for the one that's being focused on)
            for (const app of options.allApps) {
              if (!options.focusOnApps.includes(app)) {
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
    } else {
      /**
       * Workspace settings
       */
      const workspaceSettingsPath = join(
        process.cwd(),
        '.vscode',
        'settings.json'
      );
      // console.log('workspaceSettingsPath:',workspaceSettingsPath);
      let workspaceSettingsJson: any = {};
      if (existsSync(workspaceSettingsPath)) {
        const workspaceSettings = readFileSync(workspaceSettingsPath, 'UTF-8');
        workspaceSettingsJson = jsonParse(workspaceSettings);
        const exclude = workspaceSettingsJson['files.exclude'];
        workspaceSettingsJson['files.exclude'] = Object.assign(
          exclude,
          options.workspaceUpdates
        );
      } else {
        // console.log('creating workspace settings...');
        mkdirSync('.vscode');
        workspaceSettingsJson['files.exclude'] = options.workspaceUpdates;
      }
      writeFileSync(
        workspaceSettingsPath,
        serializeJson(workspaceSettingsJson)
      );
    }
    return isVsCode;
  }

  export function updateWebStorem(options: {
    userUpdates?: any;
    workspaceUpdates?: any;
    allApps?: string[];
    focusOnApps?: string[];
    appWildcards?: string[];
    isFullstack?: boolean;
    isExcluding?: boolean;
  }) {
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
    return isWebStorm;
  }

  export function createWebStormProjectView(isExcluding: boolean) {
    const projectViewObject = {
      application: {
        component: [
          {
            $: {
              name: 'ProjectViewSharedSettings'
            },
            option: [webStormExcludedViewNode(isExcluding)]
          }
        ]
      }
    };
    const builder = new xml2js.Builder({ headless: true });
    return builder.buildObject(projectViewObject);
  }
  
  export function webStormExcludedViewNode(isExcluding: boolean) {
    return {
      $: {
        name: 'showExcludedFiles',
        value: `${!isExcluding}`
      }
    };
  }
}