import { join } from 'path';

import { 
  apply,
  url,
  move,
  template,
  mergeWith,
  TemplateOptions,
  branchAndMerge,
  noop,
  SchematicsException, 
  Tree,
  Rule
} from '@angular-devkit/schematics';

// import { configPath, CliConfig } from '@schematics/angular/utility/config';
import { errorXplat } from './errors';
// import * as os from 'os';
import * as fs from 'fs';
import * as ts from 'typescript';

export const supportedPlatforms = ['web', 'nativescript', 'ionic'];
export interface ITargetPlatforms {
  web?: boolean;
  nativescript?: boolean;
  ionic?: boolean;
  ssr?: boolean;
}
export const defaultPlatforms = 'web,nativescript';

export type IDevMode = 'web' | 'nativescript' | 'ionic' | 'fullstack';

export interface NodeDependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

let npmScope: string;
let prefix: string;

export function getNpmScope() {
  return npmScope;
}

export function getPrefix() {
  return prefix;
}

export function getFileContent(tree: Tree, path: string) {
  const file = tree.read(path) || '';
  if (!file) {
    throw new SchematicsException(`${path} could not be read.`);
  }
  return file.toString('utf-8');
}

export function serializeJson(json: any): string {
  return `${JSON.stringify(json, null, 2)}\n`;
}

export function getJsonFromFile(tree: Tree, path: string) {
  return JSON.parse(getFileContent(tree, path));
}

export function updateJsonFile(tree: Tree, path: string, jsonData: any) {
  try {
    // if (tree.exists(path)) {
    tree.overwrite(path, JSON.stringify(jsonData, null, 2));
    // }
    return tree;
  } catch (err) {
    // console.warn(err);
    throw new SchematicsException(`${path}: ${err}`);
  }
}

export function updateFile(tree: Tree, path: string, content: string) {
  try {
    // if (tree.exists(path)) {
    tree.overwrite(path, content);
    // }
    return tree;
  } catch (err) {
    // console.warn(err);
    throw new SchematicsException(`${path}: ${err}`);
  }
}

export function createOrUpdate(host: Tree, path: string, content: string) {
  if (host.exists(path)) {
    host.overwrite(path, content);
  } else {
    host.create(path, content);
  }
}

export function getNxWorkspaceConfig(tree: Tree): any {
  const nxConfig = getJsonFromFile(tree, 'nx.json'); //, 'Project must be an angular cli generated project, missing angular.json');
  const hasWorkspaceDirs = tree.exists('apps') && tree.exists('libs');

  // determine if Nx workspace
  if (nxConfig) {
    // if (ngConfig.$schema.indexOf('@nrwl/schematics') > -1 || ngConfig.$schema.indexOf('@nstudio/schematics') > -1 || hasWorkspaceDirs) {
    //   return ngConfig;
    // }
    if (nxConfig.npmScope || hasWorkspaceDirs) {
      return nxConfig;
    }
  }
  throw new SchematicsException(
    '@nstudio/schematics must be used inside an Nx workspace. Create a workspace first. https://nrwl.io/nx/guide-nx-workspace'
  );
}

export const copy = (tree: Tree, from: string, to: string) => {
  const file = tree.get(from);
  if (!file) {
    throw new SchematicsException(`File ${from} does not exist!`);
  }

  tree.create(to, file.content);
};

const setDependency = (
  dependenciesMap: { [key: string]: string },
  { name, version }: NodeDependency
) => Object.assign(dependenciesMap, { [name]: version });

export function prerun(prefixArg?: string, init?: boolean) {
  return (tree: Tree) => {
    const nxJson = getNxWorkspaceConfig(tree);
    if (nxJson) {
      npmScope = nxJson.npmScope || 'workspace';
    }
    const packageJson = getJsonFromFile(tree, 'package.json');

    if (packageJson) {
      prefix = packageJson.xplat ? packageJson.xplat.prefix : '';
      if (prefixArg) {
        if (prefix) {
          // console.warn(getPrefixWarning(prefix));
        } else if (init) {
          // initializing for first time
          prefix = prefixArg;
        }
      }
      if (!prefix && !init) {
        // if not prefix was found and we're not initializing, user needs to generate xplat first
        throw new SchematicsException(errorXplat);
      }
    }
    return tree;
  };
}

export function addRootDeps(tree: Tree, packageJson?: any) {
  const packagePath = 'package.json';
  if (!packageJson) {
    packageJson = getJsonFromFile(tree, packagePath);
  }
  if (packageJson) {
    const deps: NodeDependency[] = [];
    let dep: NodeDependency = {
      name: '@ngx-translate/core',
      version: '~10.0.1',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ngx-translate/http-loader',
      version: '~3.0.1',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: `@${npmScope}/scss`,
      version: 'file:libs/scss',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: 'nativescript-angular',
      version: '~6.1.0',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: 'nativescript-ngx-fonticon',
      version: '^4.2.0',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: 'nativescript-theme-core',
      version: '^1.0.4',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: 'reflect-metadata',
      version: '^0.1.12',
      type: 'dependency'
    };
    deps.push(dep);

    // convenience for now since some {N} plugins may not support rxjs 6.x fully yet
    // remove in future
    dep = {
      name: 'rxjs-compat',
      version: '^6.2.2',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: 'tns-core-modules',
      version: '~4.2.0',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: 'tns-platform-declarations',
      version: '~4.2.0',
      type: 'devDependency'
    };
    deps.push(dep);

    const dependenciesMap = Object.assign({}, packageJson.dependencies);
    const devDependenciesMap = Object.assign({}, packageJson.devDependencies);
    for (const dependency of deps) {
      if (dependency.type === 'dependency') {
        packageJson.dependencies = setDependency(dependenciesMap, dependency);
      } else {
        packageJson.devDependencies = setDependency(
          devDependenciesMap,
          dependency
        );
      }
    }
    return updateJsonFile(tree, packagePath, packageJson);
  }
  return tree;
}

export function addRootDepsIonic(tree: Tree, packageJson?: any) {
  const packagePath = 'package.json';
  if (!packageJson) {
    packageJson = getJsonFromFile(tree, packagePath);
  }
  if (packageJson) {
    const deps: NodeDependency[] = [];
    let dep: NodeDependency = {
      name: '@ionic-native/core',
      version: '5.0.0-beta.14',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ionic-native/splash-screen',
      version: '5.0.0-beta.14',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ionic-native/status-bar',
      version: '5.0.0-beta.14',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ionic/angular',
      version: '~4.0.0-beta.1',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ionic/ng-toolkit',
      version: '~1.0.0',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ionic/schematics-angular',
      version: '~1.0.1',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ngx-translate/core',
      version: '~10.0.1',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: '@ngx-translate/http-loader',
      version: '~3.0.1',
      type: 'dependency'
    };
    deps.push(dep);

    dep = {
      name: `@${getNpmScope()}/scss`,
      version: 'file:libs/scss',
      type: 'dependency'
    };
    deps.push(dep);

    const dependenciesMap = Object.assign({}, packageJson.dependencies);
    const devDependenciesMap = Object.assign({}, packageJson.devDependencies);
    for (const dependency of deps) {
      if (dependency.type === 'dependency') {
        packageJson.dependencies = setDependency(dependenciesMap, dependency);
      } else {
        packageJson.devDependencies = setDependency(
          devDependenciesMap,
          dependency
        );
      }
    }
    return updateJsonFile(tree, packagePath, packageJson);
  }
  return tree;
}

export function updatePackageForXplat(tree: Tree) {
  const path = 'package.json';
  const packageJson = getJsonFromFile(tree, path);

  if (packageJson) {
    // TODO: track this in angular.json (or xplat.json) in future
    // doing so would involve customizing Nx schema.json which unsure about right now
    // Ideally would store this as 'project': { 'prefix': prefix } (or add 'xplat' key there) for entire workspace/xplat setup, however that's unsupported in schema out of the box
    // prefix is important because shared code is setup with a prefix to begin with which should be known and used for all subsequent apps which are generated
    packageJson.xplat = { prefix };

    // core set of supported root dependencies (out of the box)
    // console.log('updatePackageForXplat:', JSON.stringify(packageJson));
    return addRootDeps(tree, packageJson);
  }
  return tree;
}

export function updatePackageForNgrx(tree: Tree, packagePath: string = 'package.json') {
  if (tree.exists(packagePath)) {
    const packageJson = getJsonFromFile(tree, packagePath);
  
    if (packageJson) {
      // sync version with what user has store set at
      let rootNgrxVersion = packageJson.dependencies['@ngrx/store'];
  
      const deps: NodeDependency[] = [];
  
      if (packagePath.indexOf('apps') === 0) {
        // update project deps
        let dep: NodeDependency = {
          name: '@ngrx/entity',
          version: 'file:../../node_modules/@ngrx/entity',
          type: 'dependency'
        };
        deps.push(dep);
        dep = {
          name: 'ngrx-store-freeze',
          version: 'file:../../node_modules/ngrx-store-freeze',
          type: 'dependency'
        };
        deps.push(dep);
        dep = {
          name: '@nrwl/nx',
          version: 'file:../../node_modules/@nrwl/nx',
          type: 'dependency'
        };
        deps.push(dep);
      } else {
        // update root deps
        let dep: NodeDependency = {
          name: '@ngrx/entity',
          version: rootNgrxVersion,
          type: 'dependency'
        };
        deps.push(dep);
  
        if (!packageJson.dependencies['@nrwl/nx']) {
          dep = {
            name: '@nrwl/nx',
            version: '~6.1.0',
            type: 'dependency'
          };
          deps.push(dep);
        }
      }
  
      const dependenciesMap = Object.assign({}, packageJson.dependencies);
      const devDependenciesMap = Object.assign({}, packageJson.devDependencies);
      for (const dependency of deps) {
        if (dependency.type === 'dependency') {
          packageJson.dependencies = setDependency(dependenciesMap, dependency);
        } else {
          packageJson.devDependencies = setDependency(
            devDependenciesMap,
            dependency
          );
        }
      }
      return updateJsonFile(tree, packagePath, packageJson);
    }
  }
  return tree;
}

export function updateTsConfig(
  tree: Tree,
  callback: (data: any) => void,
  targetSuffix: string = ''
) {
  const tsConfigPath = `tsconfig${targetSuffix ? '.' + targetSuffix : ''}.json`;
  const tsConfig = getJsonFromFile(tree, tsConfigPath);
  callback(tsConfig);
  return updateJsonFile(tree, tsConfigPath, tsConfig);
}

export function updatePackageScripts(tree: Tree, scripts: any) {
  const path = 'package.json';
  const packageJson = getJsonFromFile(tree, path);
  const scriptsMap = Object.assign({}, packageJson.scripts);
  packageJson.scripts = Object.assign(scriptsMap, scripts);
  return updateJsonFile(tree, path, packageJson);
}

export function updateAngularProjects(tree: Tree, projects: any) {
  const path = 'angular.json';
  const angularJson = getJsonFromFile(tree, path);
  const projectsMap = Object.assign({}, angularJson.projects);
  angularJson.projects = Object.assign(projectsMap, projects);
  return updateJsonFile(tree, path, angularJson);
}

export function updateNxProjects(tree: Tree, projects: any) {
  const path = 'nx.json';
  const nxJson = getJsonFromFile(tree, path);
  const projectsMap = Object.assign({}, nxJson.projects);
  nxJson.projects = Object.assign(projectsMap, projects);
  return updateJsonFile(tree, path, nxJson);
}

export function updateGitIgnore() {
  return (tree: Tree) => {
    const gitIgnorePath = '.gitignore';
    let gitIgnore = getFileContent(tree, gitIgnorePath);
    if (gitIgnore) {
      if (gitIgnore.indexOf('libs/**/*.js') === -1) {
        gitIgnore += `
# nativescript
hooks\n
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

export function addReferences() {
  return (tree: Tree) => {
    const filename = 'references.d.ts';
    if (!tree.exists(filename)) {
      // add references.d.ts
      tree.create(
        filename,
        `/// <reference path="./node_modules/tns-platform-declarations/ios.d.ts" />
/// <reference path="./node_modules/tns-platform-declarations/android.d.ts" />
    `
      );
    }
    return tree;
  };
}

// export function persistPrefix(prefix: string) {
//   return (tree: Tree) => {
//     const nxConfig = getNxWorkspaceConfig(tree);
//     ngConfig.defaults.prefix = prefix;
//     return updateJsonFile(tree, 'angular.json', ngConfig);
//   };
// }

export function getPrefixWarning(prefix: string) {
  return `A default prefix had already been set for your workspace: ${prefix}. Since xplat had already been configured we will be using '${prefix}' as the prefix.`;
}

export function updateIDESettings(
  tree: Tree,
  platformArg: string,
  devMode?: IDevMode
) {
  try {
    const cwd = process.cwd();
    // console.log('workspace dir:', process.cwd());
    // const dirName = cwd.split('/').slice(-1);
    const userUpdates: any = {};
    if (!devMode || devMode === 'fullstack') {
      // show all
      for (const p of supportedPlatforms) {
        userUpdates[`**/apps/${p}-*`] = false;
        userUpdates[`**/xplat/${p}`] = false;
      }
    } else if (platformArg) {
      const platforms = platformArg.split(',');
      // switch on/off platforms
      for (const p of supportedPlatforms) {
        const excluded = platforms.includes(p) ? false : true;
        userUpdates[`**/apps/${p}-*`] = excluded;
        userUpdates[`**/xplat/${p}`] = excluded;
      }
    }

    // VS Code support
    // const homedir = os.homedir();
    // console.log('os.homedir():',homedir);
    let userSettingsPath =
      process.platform == 'darwin'
        ? process.env.HOME +
          `/Library/Application Support/Code/User/settings.json`
        : '/var/local/Cole/User/settings.json';
    const windowsHome = process.env.APPDATA;
    if (windowsHome) {
      userSettingsPath = join(windowsHome, 'Code/User/settings.json');
    }
    // console.log('userSettingsPath:',userSettingsPath);
    const isVsCode = fs.existsSync(userSettingsPath);
    // console.log('isVsCode:',isVsCode);
    if (isVsCode) {
      const userSettings = fs.readFileSync(userSettingsPath, 'UTF-8');
      if (userSettings) {
        const userSettingsJson = JSON.parse(userSettings);
        let exclude = userSettingsJson['files.exclude'];
        if (!exclude) {
          exclude = {};
        }
        userSettingsJson['files.exclude'] = Object.assign(exclude, userUpdates);

        let searchExclude = userSettingsJson['search.exclude'];
        if (!searchExclude) {
          searchExclude = {};
        }
        userSettingsJson['search.exclude'] = Object.assign(
          searchExclude,
          userUpdates
        );

        fs.writeFileSync(
          userSettingsPath,
          JSON.stringify(userSettingsJson, null, 2)
        );
      }
    }

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
      const workspaceSettingsPath = join(cwd, '.vscode/settings.json');
      // console.log('workspaceSettingsPath:',workspaceSettingsPath);
      let workspaceSettingsJson: any = {};
      if (fs.existsSync(workspaceSettingsPath)) {
        const workspaceSettings = fs.readFileSync(
          workspaceSettingsPath,
          'UTF-8'
        );
        workspaceSettingsJson = JSON.parse(workspaceSettings);
        const exclude = workspaceSettingsJson['files.exclude'];
        workspaceSettingsJson['files.exclude'] = Object.assign(
          exclude,
          workspaceUpdates
        );
      } else {
        // console.log('creating workspace settings...');
        fs.mkdirSync('.vscode');
        workspaceSettingsJson['files.exclude'] = workspaceUpdates;
      }
      fs.writeFileSync(
        workspaceSettingsPath,
        JSON.stringify(workspaceSettingsJson, null, 2)
      );
    }
  } catch (err) {
    // console.warn('IDE Settings could not be updated at this time:', err);
  }
  return tree;
}

/**
 * Sanitizes a given string by removing all characters that
 * are not letters or digits.
 *
 ```javascript
 sanitize('nativescript-app');  // 'nativescriptapp'
 sanitize('action_name');       // 'actioname'
 sanitize('css-class-name');    // 'cssclassname'
 sanitize('my favorite items'); // 'myfavoriteitems'
 ```

 @method sanitize
 @param {String} str The string to sanitize.
 @return {String} the sanitized string.
*/
export const sanitize = (str: string): string =>
  str
    .split('')
    .filter(char => /[a-zA-Z0-9]/.test(char))
    .join('');

/**
 * Cannot read property 'classify' of undefined
TypeError: Cannot read property 'classify' of undefined
    at Object.<anonymous> (/Users/nathan/Documents/github/nstudio/tmp/pnp-client/node_modules/@nstudio/schematics/src/utils.js:413:35)
 */
// for some reason angular-devkit/core is not resolving
// including code here manually
// const STRING_DASHERIZE_REGEXP = (/[ _]/g);
// const STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
const STRING_CAMELIZE_REGEXP = /(-|_|\.|\s)+(.)?/g;
// const STRING_UNDERSCORE_REGEXP_1 = (/([a-z\d])([A-Z]+)/g);
// const STRING_UNDERSCORE_REGEXP_2 = (/-|\s+/g);

function camelize(str) {
  return str
    .replace(STRING_CAMELIZE_REGEXP, (_match, _separator, chr) => {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/^([A-Z])/, match => match.toLowerCase());
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

function classify(str) {
  return str
    .split('.')
    .map(part => capitalize(camelize(part)))
    .join('.');
}

export const stringUtils = { sanitize, classify, capitalize };

export const toComponentClassName = (name: string) =>
  `${classify(name)}Component`;

export const toNgModuleClassName = (name: string) => `${classify(name)}Module`;
