import type {
  FrameworkOptions,
  FrameworkTypes,
  ITargetPlatforms,
  PlatformModes,
  PlatformNxExtraTypes,
  PlatformTypes,
  PlatformWithNxTypes,
} from './types';
import {
  Tree,
  SchematicContext,
  SchematicsException,
} from '@angular-devkit/schematics';
import { parseJson } from '@nrwl/devkit';
import { createOrUpdate, serializeJson } from '@nrwl/workspace';

export const supportedPlatforms: Array<PlatformTypes> = [
  'web',
  'nativescript',
  'ionic',
  'electron',
];
export const supportedNxExtraPlatforms: Array<PlatformNxExtraTypes> = [
  'express',
  'nest',
  'node',
  'react',
];
export const supportedPlatformsWithNx: Array<PlatformWithNxTypes> = supportedPlatforms.concat(
  <any>supportedNxExtraPlatforms
);

export const supportedFrameworks: Array<FrameworkTypes> = ['angular']; //, 'react', 'vue'];

let npmScope: string;
// selector prefix to use when generating various boilerplate for xplat support
let prefix: string;
// user preferred default framework
let frontendFramework: FrameworkTypes;
// Group by app name (appname-platform) instead of the default (platform-appname)
let groupByName = false;
let isTest = false;
let usingXplatWorkspace = false;

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

export function isXplatWorkspace() {
  return usingXplatWorkspace;
}

export function setTest() {
  isTest = true;
}

export function isTesting() {
  return isTest;
}

export function jsonParse(content: string) {
  if (content) {
    // ensure comments are stripped when parsing (otherwise will fail)
    return parseJson(content);
  }
  return {};
}

export function getJsonFromFile(tree: Tree, path: string) {
  // console.log('getJsonFromFile:', path)
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

export function getRootTsConfigPath() {
  return '/tsconfig.base.json';
}

export function getAppPaths(
  tree: Tree,
  type?: PlatformTypes // by default, will return all app paths (considering folder nesting)
): Array<string> {
  const appsDir = tree.getDir('apps');
  const appPaths: Array<string> = [];

  const checkIfPlatform = (dirPath: string) => {
    let packagePath = `${dirPath}/package.json`;
    // check for platform via it's package (web is only app type that doesn't have a package)
    switch (type) {
      case 'nativescript':
        if (tree.exists(`${dirPath}/nativescript.config.ts`)) {
          appPaths.push(dirPath);
        }
        break;
      case 'ionic':
        if (tree.exists(packagePath)) {
          const packageData = getJsonFromFile(tree, packagePath);
          if (
            packageData.dependencies &&
            packageData.dependencies['@capacitor/core']
          ) {
            appPaths.push(dirPath);
          }
        }
        break;
      case 'electron':
        let embeddedPackage = `${dirPath}/src/package.json`;
        if (tree.exists(embeddedPackage)) {
          const packageData = getJsonFromFile(tree, embeddedPackage);
          if (packageData.build && packageData.build.appId) {
            appPaths.push(dirPath);
          }
        }
        break;
      case 'web':
        if (!tree.exists(packagePath)) {
          // web app when no package is present
          appPaths.push(dirPath);
        }
        break;
    }
  };
  for (const dir of appsDir.subdirs) {
    let tsconfigPath = `${appsDir.path}/${dir}/tsconfig.json`;

    if (tree.exists(tsconfigPath)) {
      // this is an app directory
      if (type) {
        checkIfPlatform(`${appsDir.path}/${dir}`);
      } else {
        appPaths.push(`${appsDir.path}/${dir}`);
      }
    } else {
      // apps in nested folders
      const subDirs = tree.getDir(`${appsDir.path}/${dir}`).subdirs;
      for (const subDir of subDirs) {
        tsconfigPath = `${appsDir.path}/${dir}/${subDir}/tsconfig.json`;
        if (tree.exists(tsconfigPath)) {
          // this is an app directory
          if (type) {
            checkIfPlatform(`${appsDir.path}/${dir}/${subDir}`);
          } else {
            appPaths.push(`${appsDir.path}/${dir}/${subDir}`);
          }
        }
      }
    }
  }

  return appPaths;
}

export function prerun(options?: any, init?: boolean) {
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
        usingXplatWorkspace = true;
        const xplatSettings = packageJson.xplat; //<IXplatSettings>packageJson.xplat;
        // use persisted xplat settings
        prefix = xplatSettings.prefix || npmScope; // (if not prefix, default to npmScope)
        frontendFramework = xplatSettings.framework;

        if (options) {
          if (options.prefix) {
            // always use explicit prefix user passed in
            prefix = options.prefix;
          } else {
            // ensure options are updated
            options.prefix = prefix;
          }
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
      .filter((i) => !!i)
      .map((i) => i.trim().toLowerCase());
  }
  return [];
}

export function parseProjectNameFromPath(input: string): string {
  if (input && input.indexOf('/') > -1) {
    input = input.split('/').pop();
  }
  return input;
}
