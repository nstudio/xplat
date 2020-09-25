import * as stripJsonComments from 'strip-json-comments';
import {
  SchematicsException,
  Tree,
  SchematicContext,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  stringUtils as nxStringUtils,
  serializeJson,
  updateWorkspaceInTree,
  readJsonInTree,
  getWorkspacePath,
} from '@nrwl/workspace';
import {
  supportedPlatforms,
  PlatformTypes,
  FrameworkTypes,
  supportedFrameworks,
  PlatformWithNxTypes,
  supportedPlatformsWithNx,
  ITargetPlatforms,
  getJsonFromFile,
  updateJsonFile,
  getNpmScope,
  getPrefix,
} from '@nstudio/xplat-utils';

export interface NodeDependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

export interface IXplatSettings {
  prefix?: string;
  groupByName?: boolean;
  framework?: FrameworkTypes;
  platforms?: string;
}

// list of all supported helpers
// TODO: add more convenient helpers (like firebase or Travis ci support files)
export const supportedHelpers = ['imports', 'applitools'];
// list of platforms that support various sandbox flags
export const supportedSandboxPlatforms: Array<PlatformTypes> = ['nativescript'];

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

      const dependencies = {};
      const devDependencies = {};

      if (packagePath.indexOf('apps') === 0) {
        // update project deps
        dependencies['@ngrx/entity'] = 'file:../../node_modules/@ngrx/entity';
        dependencies['ngrx-store-freeze'] =
          'file:../../node_modules/ngrx-store-freeze';
      } else {
        // update root deps
        dependencies['@ngrx/entity'] = rootNgrxVersion;
      }

      packageJson.dependencies = {
        ...(packageJson.dependencies || {}),
        ...dependencies,
      };

      packageJson.devDependencies = {
        ...(packageJson.devDependencies || {}),
        ...devDependencies,
      };

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
  if (!prefixPath && tree.exists('/tsconfig.base.json')) {
    // when root tsconfig, always modify base if exists
    targetSuffix = 'base';
  }
  let tsConfigPath: string = `${prefixPath}tsconfig${
    targetSuffix ? '.' + targetSuffix : ''
  }.json`;
  const tsConfigPrefix = 'tsconfig';
  if (!targetSuffix) {
    if (tree.exists(`${tsConfigPrefix}.json`)) {
      tsConfigPath = `${tsConfigPrefix}.json`;
    } else if (tree.exists(`${tsConfigPrefix}.base.json`)) {
      tsConfigPath = `${tsConfigPrefix}.base.json`;
    }
  }
  // console.log('tsConfigPath:', tsConfigPath)
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

export function readWorkspaceJson(tree: Tree) {
  return readJsonInTree(tree, getWorkspacePath(tree));
}

export function updateWorkspace(updates: any) {
  return <any>updateWorkspaceInTree((json) => {
    for (const key in updates) {
      json[key] = {
        ...(json[key] || {}),
        ...updates[key],
      };
    }
    return json;
  });
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

export function getDefaultTemplateOptions() {
  // console.log('getDefaultTemplateOptions getPrefix:', getPrefix());
  return {
    tmpl: '',
    utils: stringUtils,
    npmScope: getNpmScope(),
    prefix: getPrefix(),
    dot: '.',
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
    .filter((char) => /[a-zA-Z0-9]/.test(char))
    .join('');

export const stringUtils = { sanitize, ...nxStringUtils };

export const toComponentClassName = (name: string) =>
  `${stringUtils.classify(name)}Component`;

export const toNgModuleClassName = (name: string) =>
  `${stringUtils.classify(name)}Module`;
