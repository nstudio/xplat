const xml2js = require('xml2js');
import * as stripJsonComments from 'strip-json-comments';
import {
  SchematicsException,
  Tree,
  SchematicContext
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { stringUtils as nxStringUtils, serializeJson } from '@nrwl/workspace';

export interface ITargetPlatforms {
  web?: boolean;
  nativescript?: boolean;
  ionic?: boolean;
  electron?: boolean;
}

export type PlatformTypes = 'web' | 'nativescript' | 'ionic' | 'electron';
export type PlatformModes = PlatformTypes | 'fullstack';
export const supportedPlatforms: Array<PlatformTypes> = [
  'web',
  'nativescript',
  'ionic',
  'electron'
];

export type FrameworkTypes = 'angular';
// TODO: support react/vue and more
// | 'react'
// | 'vue'
export type FrameworkOptions = FrameworkTypes | 'all';
export const supportedFrameworks: Array<FrameworkTypes> = ['angular']; //, 'react', 'vue'];

export interface NodeDependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

// list of all supported helpers
// TODO: add more convenient helpers (like firebase or Travis ci support files)
export const supportedHelpers = ['imports', 'applitools'];
// list of platforms that support various sandbox flags
export const supportedSandboxPlatforms: Array<PlatformTypes> = ['nativescript'];

let npmScope: string;
// selector prefix to use when generating various boilerplate for xplat support
let prefix: string;
// user preferred default framework
let frontendFramework: FrameworkTypes;
// Group by app name (appname-platform) instead of the default (platform-appname)
let groupByName = false;
let isTest = false;

export function getNpmScope() {
  return npmScope;
}

export function getPrefix() {
  return prefix;
}

export function getFrontendFramework() {
  return frontendFramework;
}

export function getGroupByName() {
  return groupByName;
}

export function getAppName(options: any, platform: PlatformTypes) {
  return groupByName
    ? options.name.replace(`-${platform}`, '')
    : options.name.replace(`${platform}-`, '');
}

export function setTest() {
  isTest = true;
}

export function isTesting() {
  return isTest;
}

export function addInstallTask(options: any) {
  return (host: Tree, context: SchematicContext) => {
    if (!options.skipInstall) {
      context.addTask(new NodePackageInstallTask());
    }
    return host;
  };
}

export function jsonParse(content: string) {
  if (content) {
    // ensure comments are stripped when parsing (otherwise will fail)
    return JSON.parse(stripJsonComments(content));
  }
  return {};
}

export function getJsonFromFile(tree: Tree, path: string) {
  return jsonParse(tree.get(path).content.toString());
}

export function updateJsonFile(tree: Tree, path: string, jsonData: any) {
  try {
    // if (tree.exists(path)) {
    tree.overwrite(path, serializeJson(jsonData));
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
  const nxConfig = getJsonFromFile(tree, 'nx.json');
  const hasWorkspaceDirs = tree.exists('apps') && tree.exists('libs');

  // determine if Nx workspace
  if (nxConfig) {
    if (nxConfig.npmScope || hasWorkspaceDirs) {
      return nxConfig;
    }
  }
  throw new SchematicsException(
    '@nstudio/xplat must be used inside an Nx workspace. Create a workspace first. https://nx.dev'
  );
}

export const copy = (tree: Tree, from: string, to: string) => {
  const file = tree.get(from);
  if (!file) {
    throw new SchematicsException(`File ${from} does not exist!`);
  }

  tree.create(to, file.content);
};

export const setDependency = (
  dependenciesMap: { [key: string]: string },
  { name, version }: NodeDependency
) => Object.assign(dependenciesMap, { [name]: version });

export interface IXplatSettings {
  prefix?: string;
  groupByName?: boolean;
  framework?: FrameworkTypes;
  platforms?: string;
}

export function prerun(options?: IXplatSettings | any, init?: boolean) {
  return (tree: Tree) => {
    const nxJson = getNxWorkspaceConfig(tree);
    if (nxJson) {
      npmScope = nxJson.npmScope || 'workspace';
    }
    // console.log('npmScope:', npmScope);
    const packageJson = getJsonFromFile(tree, 'package.json');

    let frameworkChoice: string;
    if (options && options.framework) {
      // can actually specify comma delimited list of frameworks to generate support for
      // most common to generate 1 at a time but we allow multiple
      const frameworks = sanitizeCommaDelimitedArg(options.framework);
      // always default framework choice to first in list when multiple
      // when it's just one (most common) will be first already
      frameworkChoice = frameworks[0];
    }
    // console.log('frameworkChoice:', frameworkChoice);

    if (packageJson) {
      prefix = '';
      if (packageJson.xplat) {
        const xplatSettings = <IXplatSettings>packageJson.xplat;
        // use persisted xplat settings
        prefix = xplatSettings.prefix || npmScope; // (if not prefix, default to npmScope)
        frontendFramework = xplatSettings.framework;

        if (options) {
          // ensure options are updated
          options.prefix = prefix;
          if (frameworkChoice) {
            // always override default framework when user has explicitly passed framework option in
            frontendFramework = <FrameworkTypes>frameworkChoice;
          }
          // else if (frontendFramework) {
          //   // ensure the options use the default
          //   options.framework = frontendFramework;
          // }
        }
        // grouping
        groupByName =
          xplatSettings.groupByName || (options ? options.groupByName : false);
      } else if (options) {
        groupByName = options.groupByName;
        if (options.prefix) {
          if (!prefix && init) {
            // initializing for first time
            prefix = options.prefix;
          }
        } else {
          // default to npmScope for prefix
          options.prefix = npmScope;
        }
        if (frameworkChoice) {
          if (!frontendFramework && init) {
            frontendFramework = <FrameworkTypes>frameworkChoice;
          }
        }
      }
      // console.log('prefix:', prefix);
      // if (!prefix) {
      //   if (init) {
      //     // if no prefix was found and we're initializing, user need to specify a prefix
      //     throw new SchematicsException(errorMissingPrefix);
      //   } else {
      //     // if no prefix was found and we're not initializing, user needs to generate xplat first
      //     throw new SchematicsException(errorXplat);
      //   }
      // }
    }
    // console.log('prefix:', prefix);
    return tree;
  };
}

export function sanitizeCommaDelimitedArg(input: string): Array<string> {
  if (input) {
    return input
      .split(',')
      .filter(i => !!i)
      .map(i => i.trim().toLowerCase());
  }
  return [];
}

/**
 * Check if the platform is frontend (some could be backend only)
 *
 * Useful for deciding which dependencies or files should be added
 *
 * @param targetPlatforms
 */
export function hasFrontendPlatform(targetPlatforms: ITargetPlatforms) {
  return (
    targetPlatforms.web ||
    targetPlatforms.ionic ||
    targetPlatforms.electron ||
    targetPlatforms.nativescript
  );
}

/**
 * Check if the platform will need a web app to be generated.
 *
 * Useful for deciding which dependencies or files should be added
 *
 * @param targetPlatforms
 */
export function hasWebPlatform(targetPlatforms: ITargetPlatforms) {
  return (
    targetPlatforms.web || targetPlatforms.ionic || targetPlatforms.electron
  );
}

export function updatePackageForNgrx(
  tree: Tree,
  packagePath: string = 'package.json'
) {
  if (tree.exists(packagePath)) {
    const packageJson = getJsonFromFile(tree, packagePath);

    if (packageJson) {
      // sync version with what user has store set at
      let rootNgrxVersion = packageJson.dependencies
        ? packageJson.dependencies['@ngrx/store']
        : null;

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
      } else {
        // update root deps
        let dep: NodeDependency = {
          name: '@ngrx/entity',
          version: rootNgrxVersion,
          type: 'dependency'
        };
        deps.push(dep);
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
  targetSuffix: string = '',
  prefixPath: string = ''
) {
  const tsConfigPath = `${prefixPath}tsconfig${
    targetSuffix ? '.' + targetSuffix : ''
  }.json`;
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

export function getDefaultTemplateOptions() {
  // console.log('getDefaultTemplateOptions getPrefix:', getPrefix());
  return {
    tmpl: '',
    utils: stringUtils,
    npmScope: getNpmScope(),
    prefix: getPrefix(),
    dot: '.'
  };
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

export const stringUtils = { sanitize, ...nxStringUtils };

export const toComponentClassName = (name: string) =>
  `${stringUtils.classify(name)}Component`;

export const toNgModuleClassName = (name: string) =>
  `${stringUtils.classify(name)}Module`;
