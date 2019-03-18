import { join } from "path";

import {
  apply,
  url,
  move,
  template,
  mergeWith,
  branchAndMerge,
  noop,
  SchematicsException,
  Tree,
  Rule,
  SchematicContext
} from "@angular-devkit/schematics";

// import { configPath, CliConfig } from '@schematics/angular/utility/config';
import { errorXplat, errorMissingPrefix } from "./errors";
// import * as os from 'os';
import * as fs from "fs";
import * as ts from "typescript";
import { toFileName } from "./name-utils";
const util = require('util');
const xml2js = require('xml2js');
import * as stripJsonComments from 'strip-json-comments';

export const supportedPlatforms = [
  "web",
  "nativescript",
  "ionic",
  "electron",
  "nest"
];
export interface ITargetPlatforms {
  web?: boolean;
  nativescript?: boolean;
  ionic?: boolean;
  electron?: boolean;
  ssr?: boolean;
  nest?: boolean;
}

export type PlatformTypes =
  | "web"
  | "nativescript"
  | "ionic"
  | "electron"
  | "nest"
  | "fullstack";

export interface NodeDependency {
  name: string;
  version: string;
  type: "dependency" | "devDependency";
}

// list of all supported helpers
// TODO: add more convenient helpers (like firebase or Travis ci support files)
export const supportedHelpers = ['imports', 'applitools'];
// list of platforms that support various sandbox flags
export const supportedSandboxPlatforms: Array<PlatformTypes> = ['nativescript'];

let npmScope: string;
// selector prefix to use when generating various boilerplate for xplat support
let prefix: string;
// Group by app name (appname-platform) instead of the default (platform-appname)
let groupByName = false;
let isTest = false;

export function getNpmScope() {
  return npmScope;
}

export function getPrefix() {
  return prefix;
}

export function getGroupByName() {
  return groupByName;
}

export function getAppName(options: any, platform: PlatformTypes) {
  return groupByName ? options.name.replace(`-${platform}`, '') : options.name.replace(`${platform}-`, '');
}

export function getFileContent(tree: Tree, path: string) {
  const file = tree.read(path) || "";
  if (!file) {
    throw new SchematicsException(`${path} could not be read.`);
  }
  return file.toString("utf-8");
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
    return JSON.parse(stripJsonComments(content));
  }
  return {};
}

export function serializeJson(json: any): string {
  return `${JSON.stringify(json, null, 2)}\n`;
}

export function getJsonFromFile(tree: Tree, path: string) {
  return jsonParse(getFileContent(tree, path));
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
  const nxConfig = getJsonFromFile(tree, "nx.json"); //, 'Project must be an angular cli generated project, missing angular.json');
  const hasWorkspaceDirs = tree.exists("apps") && tree.exists("libs");

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
    "@nstudio/schematics must be used inside an Nx workspace. Create a workspace first. https://nrwl.io/nx/guide-nx-workspace"
  );
}

/**
 * Returns a name with the platform.
 * 
 * @example (app, nest) => web-app or app-web
 * @param name 
 * @param platform 
 */
export function getPlatformName(name: string, platform: PlatformTypes) {
  const nameSanitized = toFileName(name);
  return groupByName ? `${nameSanitized}-${platform}` : `${platform}-${nameSanitized}`;
}

export function applyAppNamingConvention(options: any, platform: PlatformTypes) {
  return (tree: Tree, context: SchematicContext) => {
    options.name = getPlatformName(options.name, platform);
    // if command line argument, make sure it's persisted to xplat settings
    if (options.groupByName) {
      return updatePackageForXplat(tree, null, {
        groupByName: true
      });
    } else {
      // adjusted name, nothing else to do
      return noop()(tree, context);
    }
  };
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

export function prerun(options?: any, init?: boolean) {
  return (tree: Tree) => {
    const nxJson = getNxWorkspaceConfig(tree);
    if (nxJson) {
      npmScope = nxJson.npmScope || "workspace";
    }
    // console.log('npmScope:', npmScope);
    const packageJson = getJsonFromFile(tree, "package.json");

    if (packageJson) {
      prefix = "";
      if (packageJson.xplat) {
        // use persisted xplat settings 
        prefix = packageJson.xplat.prefix || npmScope; // (if not prefix, default to npmScope)
        if (options) {
          // ensure options are updated
          options.prefix = prefix;
        }
        // grouping
        groupByName = packageJson.xplat.groupByName || (options ? options.groupByName : false);
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
      }
      // console.log('prefix:', prefix);
      if (!prefix) {
        if (init) {
          // if no prefix was found and we're initializing, user need to specify a prefix
          throw new SchematicsException(errorMissingPrefix);
        } else {
          // if no prefix was found and we're not initializing, user needs to generate xplat first
          throw new SchematicsException(errorXplat);
        }
      }
    }
    return tree;
  };
}

export function sanitizeCommaDelimitedArg(input: string): Array<string> {
  if (input) {
    return input
      .split(",")
      .filter(i => !!i)
      .map(i => i.trim().toLowerCase());
  }
  return [];
}

export function addRootDeps(
  tree: Tree,
  targetPlatforms: ITargetPlatforms,
  packageJson?: any
) {
  const packagePath = "package.json";
  if (!packageJson) {
    packageJson = getJsonFromFile(tree, packagePath);
  }
  if (packageJson) {
    const angularVersion = packageJson.dependencies['@angular/core'];

    const deps: NodeDependency[] = [];

    let dep: NodeDependency = {
      name: "@ngx-translate/core",
      version: "~11.0.0",
      type: "dependency"
    };
    deps.push(dep);

    dep = {
      name: "@ngx-translate/http-loader",
      version: "~4.0.0",
      type: "dependency"
    };
    deps.push(dep);

    if (!targetPlatforms.nest) {
      // if just setting up workspace with nest, we don't need frontend scss
      dep = {
        name: `@${getNpmScope()}/scss`,
        version: "file:libs/scss",
        type: "dependency"
      };
      deps.push(dep);
    }

    dep = {
      name: "reflect-metadata",
      version: "^0.1.12",
      type: "dependency"
    };
    deps.push(dep);

    /** NATIVESCRIPT */
    if (targetPlatforms.nativescript) {
      dep = {
        name: "nativescript-angular",
        version: "~7.2.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "nativescript-ngx-fonticon",
        version: "^4.2.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "nativescript-theme-core",
        version: "^1.0.4",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "tns-core-modules",
        version: "~5.2.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "terser-webpack-plugin",
        version: "~1.2.0",
        type: "devDependency"
      };

      dep = {
        name: "tns-platform-declarations",
        version: "~5.2.0",
        type: "devDependency"
      };
      deps.push(dep);
    }

    /** IONIC */
    if (targetPlatforms.ionic) {
      dep = {
        name: "@ionic-native/core",
        version: "^5.0.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@ionic-native/splash-screen",
        version: "^5.0.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@ionic-native/status-bar",
        version: "^5.0.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@ionic/angular",
        version: "^4.0.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@ionic/angular-toolkit",
        version: "~1.2.0",
        type: "devDependency"
      };
      deps.push(dep);
    }

    /** ELECTRON */
    if (targetPlatforms.electron) {

      // electron complains if this is missing
      dep = {
        name: "@angular/http",
        version: angularVersion,
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "electron",
        version: "^4.0.5",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-builder",
        version: "^20.38.4",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-rebuild",
        version: "~1.8.4",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-installer-dmg",
        version: "~2.0.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-packager",
        version: "~13.1.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-reload",
        version: "~1.4.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-store",
        version: "~2.0.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "electron-updater",
        version: "~4.0.6",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "npm-run-all",
        version: "^4.1.5",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "npx",
        version: "10.2.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "wait-on",
        version: "~3.2.0",
        type: "devDependency"
      };
      deps.push(dep);
    }

    /** NESTJS */
    if (targetPlatforms.nest) {
      dep = {
        name: "@nestjs/common",
        version: "^5.3.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@nestjs/core",
        version: "^5.3.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@nestjs/testing",
        version: "^5.3.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@nestjs/typeorm",
        version: "^5.2.2",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@nestjs/websockets",
        version: "^5.5.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@nestjs/microservices",
        version: "^5.5.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "typeorm",
        version: "^0.2.9",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "cache-manager",
        version: "^2.9.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "helmet",
        version: "^3.15.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "csurf",
        version: "^1.9.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "express-rate-limit",
        version: "^3.3.2",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "dotenv",
        version: "^6.2.0",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "compression",
        version: "^1.7.3",
        type: "dependency"
      };
      deps.push(dep);

      dep = {
        name: "@types/node",
        version: "^9.3.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "ts-loader",
        version: "^4.0.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "ts-node",
        version: "^7.0.0",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "npm-run-all",
        version: "^4.1.5",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "@types/jest",
        version: "^20.0.8",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "jest",
        version: "^20.0.4",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "ts-jest",
        version: "^20.0.14",
        type: "devDependency"
      };
      deps.push(dep);

      dep = {
        name: "supertest",
        version: "^3.0.0",
        type: "devDependency"
      };
      deps.push(dep);
    }

    if (targetPlatforms.ionic || targetPlatforms.electron) {
      // ability to import web scss and share it
      dep = {
        name: `@${getNpmScope()}/web`,
        version: "file:xplat/web",
        type: "dependency"
      };
      deps.push(dep);
    }

    const dependenciesMap = Object.assign({}, packageJson.dependencies);
    const devDependenciesMap = Object.assign({}, packageJson.devDependencies);
    for (const dependency of deps) {
      if (dependency.type === "dependency") {
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

export function updatePackageForXplat(
  tree: Tree,
  // used when generating xplat support
  targetPlatforms?: ITargetPlatforms,
  // used to update various xplat workspace settings 
  // can be used in combination with other generators to adjust settings 
  updatedSettings?: any
) {
  const packagePath = "package.json";
  const packageJson = getJsonFromFile(tree, packagePath);

  if (packageJson) {
    // TODO: potentially track this in angular.json (or xplat.json) in future
    // doing so would involve customizing Nx schema.json which unsure about right now
    // Ideally would store this as 'project': { 'prefix': prefix } (or add 'xplat' key there) for entire workspace/xplat setup, however that's unsupported in schema out of the box
    // prefix is important because shared code is setup with a prefix to begin with which should be known and used for all subsequent apps which are generated
    
    if (updatedSettings) {
      packageJson.xplat = { 
        ...packageJson.xplat,
        ...updatedSettings
      };
      // just update xplat workspace settings
      return updateJsonFile(tree, packagePath, packageJson)
    } else {
      packageJson.xplat = { prefix };
      // update root dependencies for the generated xplat support
      // console.log('updatePackageForXplat:', JSON.stringify(packageJson));
      return addRootDeps(tree, targetPlatforms, packageJson);
    }
  }
  return tree;
}

export function updatePackageForNgrx(
  tree: Tree,
  packagePath: string = "package.json"
) {
  if (tree.exists(packagePath)) {
    const packageJson = getJsonFromFile(tree, packagePath);

    if (packageJson) {
      // sync version with what user has store set at
      let rootNgrxVersion = packageJson.dependencies["@ngrx/store"];

      const deps: NodeDependency[] = [];

      if (packagePath.indexOf("apps") === 0) {
        // update project deps
        let dep: NodeDependency = {
          name: "@ngrx/entity",
          version: "file:../../node_modules/@ngrx/entity",
          type: "dependency"
        };
        deps.push(dep);
        dep = {
          name: "ngrx-store-freeze",
          version: "file:../../node_modules/ngrx-store-freeze",
          type: "dependency"
        };
        deps.push(dep);
        dep = {
          name: "@nrwl/nx",
          version: "file:../../node_modules/@nrwl/nx",
          type: "dependency"
        };
        deps.push(dep);
      } else {
        // update root deps
        let dep: NodeDependency = {
          name: "@ngrx/entity",
          version: rootNgrxVersion,
          type: "dependency"
        };
        deps.push(dep);

        if (!packageJson.dependencies["@nrwl/nx"]) {
          dep = {
            name: "@nrwl/nx",
            version: "~7.0.0",
            type: "dependency"
          };
          deps.push(dep);
        }
      }

      const dependenciesMap = Object.assign({}, packageJson.dependencies);
      const devDependenciesMap = Object.assign({}, packageJson.devDependencies);
      for (const dependency of deps) {
        if (dependency.type === "dependency") {
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
  const tsConfigPath = `${prefixPath}tsconfig${targetSuffix ? "." + targetSuffix : ""}.json`;
  const tsConfig = getJsonFromFile(tree, tsConfigPath);
  callback(tsConfig);
  return updateJsonFile(tree, tsConfigPath, tsConfig);
}

export function updatePackageScripts(tree: Tree, scripts: any) {
  const path = "package.json";
  const packageJson = getJsonFromFile(tree, path);
  const scriptsMap = Object.assign({}, packageJson.scripts);
  packageJson.scripts = Object.assign(scriptsMap, scripts);
  return updateJsonFile(tree, path, packageJson);
}

export function updateAngularProjects(tree: Tree, projects: any) {
  const path = "angular.json";
  const angularJson = getJsonFromFile(tree, path);
  const projectsMap = Object.assign({}, angularJson.projects);
  angularJson.projects = Object.assign(projectsMap, projects);
  return updateJsonFile(tree, path, angularJson);
}

export function updateNxProjects(tree: Tree, projects: any) {
  const path = "nx.json";
  const nxJson = getJsonFromFile(tree, path);
  const projectsMap = Object.assign({}, nxJson.projects);
  nxJson.projects = Object.assign(projectsMap, projects);
  return updateJsonFile(tree, path, nxJson);
}

export function updateGitIgnore() {
  return (tree: Tree) => {
    const gitIgnorePath = ".gitignore";
    let gitIgnore = getFileContent(tree, gitIgnorePath);
    if (gitIgnore) {
      if (gitIgnore.indexOf("libs/**/*.js") === -1) {
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
      if (gitIgnore.indexOf("xplat/**/*.js") === -1) {
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
    const filename = "references.d.ts";
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

export function addPostinstallers() {
  return (tree: Tree) => {
    const postinstallWeb = "/tools/web/postinstall.js";
    if (!tree.exists(postinstallWeb)) {
      // add references.d.ts
      tree.create(
        postinstallWeb,
        `// Allow angular using electron module (native node modules)
const fs = require('fs');
const f_angular = 'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js';

fs.readFile(f_angular, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/target: "electron-renderer",/g, '');
  var result = result.replace(/target: "web",/g, '');
  var result = result.replace(/return \{/g, 'return {target: "web",');

  fs.writeFile(f_angular, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});`
      );
    }
    const postinstallElectron = "/tools/electron/postinstall.js";
    if (!tree.exists(postinstallElectron)) {
      // add references.d.ts
      tree.create(
        postinstallElectron,
        `// Allow angular using electron module (native node modules)
const fs = require('fs');
const f_angular = 'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js';

fs.readFile(f_angular, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/target: "electron-renderer",/g, '');
  var result = result.replace(/target: "web",/g, '');
  var result = result.replace(/return \{/g, 'return {target: "electron-renderer",');

  fs.writeFile(f_angular, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});`
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

export const addTestingFiles = (
  tree: Tree,
  options: any,
  relativePath: string = "./"
) => {
  if (tree.exists(`testing/karma.conf.js`)) {
    return noop();
  }

  return branchAndMerge(
    mergeWith(
      apply(url(`${relativePath}_testing_files`), [
        template({
          ...(options as any),
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: ".",
          utils: stringUtils
        }),
        move("testing")
      ])
    )
  );
};

export function updateIDESettings(
  tree: Tree,
  platformArg: string,
  devMode?: PlatformTypes,
  allApps?: string[],
  focusOnApps?: string[],
) {
  if (isTest) {
    // ignore node file modifications when just testing
    return tree;
  }

  try {
    const cwd = process.cwd();
    // console.log('workspace dir:', process.cwd());
    // const dirName = cwd.split('/').slice(-1);
    let isFullstack = false;
    let isExcluding = false;
    let appWildcards = [];
    const userUpdates: any = {};
    if (!devMode || devMode === "fullstack") {
      // show all
      isFullstack = true;
      for (const p of supportedPlatforms) {
        const appFilter = groupByName ? `*-${p}` : `${p}-*`;
        userUpdates[`**/apps/${appFilter}`] = false;
        userUpdates[`**/xplat/${p}`] = false;
      }
    } else if (platformArg) {
      const platforms = sanitizeCommaDelimitedArg(platformArg);
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

        if (excluded) {
          // if excluding any platform at all, set the flag
          // this is used for WebStorm support below
          isExcluding = true;
        }
      }
    }

    const isMac = process.platform == "darwin";

    // VS Code support
    // const homedir = os.homedir();
    // console.log('os.homedir():',homedir);
    let userSettingsVSCodePath =
      isMac
        ? process.env.HOME +
          `/Library/Application Support/Code/User/settings.json`
        : "/var/local/Code/User/settings.json";
    const windowsHome = process.env.APPDATA;
    if (windowsHome) {
      userSettingsVSCodePath = join(windowsHome, "Code", "User", "settings.json");
    }
    // console.log('userSettingsVSCodePath:',userSettingsVSCodePath);
    const isVsCode = fs.existsSync(userSettingsVSCodePath);
    let vscodeCreateSettingsNote = `It's possible you don't have a user settings.json yet. If so, open VS Code User settings and save any kind of setting to have it created.`;
    // console.log('isVsCode:',isVsCode);
    if (isVsCode) {
      const userSettings = fs.readFileSync(userSettingsVSCodePath, "UTF-8");
      if (userSettings) {
        const userSettingsJson = jsonParse(userSettings);
        let exclude = userSettingsJson["files.exclude"];
        if (!exclude) {
          exclude = {};
        }
        let searchExclude = userSettingsJson["search.exclude"];
        if (!searchExclude) {
          searchExclude = {};
        }

        userSettingsJson["files.exclude"] = Object.assign(exclude, userUpdates);
        userSettingsJson["search.exclude"] = Object.assign(
          searchExclude,
          userUpdates
        );

        if (allApps.length) {
          // always reset specific app filters
          for (const app of allApps) {
            delete userSettingsJson["files.exclude"][app];
            delete userSettingsJson["search.exclude"][app];
          }
        }
        if (!isFullstack && focusOnApps.length && allApps.length) {
          // when focusing on projects, clear all specific app wildcards first if they exist
          for (const wildcard of appWildcards) {
            delete userSettingsJson["files.exclude"][wildcard];
            delete userSettingsJson["search.exclude"][wildcard];
          }
          for (const focusApp of focusOnApps) {
            userSettingsJson["files.exclude"][focusApp] = false;
            userSettingsJson["search.exclude"][focusApp] = false;
          }
          // ensure all other apps are excluded (except for the one that's being focused on)
          for (const app of allApps) {
            if (!focusOnApps.includes(app)) {
              userSettingsJson["files.exclude"][app] = true;
              userSettingsJson["search.exclude"][app] = true;
            }
          }
        }

        fs.writeFileSync(
          userSettingsVSCodePath,
          JSON.stringify(userSettingsJson, null, 2)
        );
      } else {
        console.warn(`Warning: xplat could not read your VS Code settings.json file therefore development mode has not been set. ${vscodeCreateSettingsNote}`);
      }
    } else {
      console.log(`Note to VS Code users: no development mode set. xplat could not find any VS Code settings in the standard location: ${userSettingsVSCodePath} ${vscodeCreateSettingsNote}`)
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
        "**/node_modules": true,
        "**/hooks": true,
        "**/apps/nativescript-*/app/package.json": false,
        "**/apps/nativescript-*/hooks": true,
        "**/apps/nativescript-*/platforms": true,
        "**/apps/nativescript-*/report": true,
        "**/apps/nativescript-*/app/**/*.js": {
          when: "$(basename).ts"
        },
        "**/apps/nativescript-*/app/**/*.d.ts": {
          when: "$(basename).ts"
        },
        "**/apps/nativescript-*/app/**/*.css": {
          when: "$(basename).scss"
        },
        // also add groupByName support
        "**/apps/*-nativescript/app/package.json": false,
        "**/apps/*-nativescript/hooks": true,
        "**/apps/*-nativescript/platforms": true,
        "**/apps/*-nativescript/report": true,
        "**/apps/*-nativescript/app/**/*.js": {
          when: "$(basename).ts"
        },
        "**/apps/*-nativescript/app/**/*.d.ts": {
          when: "$(basename).ts"
        },
        "**/apps/*-nativescript/app/**/*.css": {
          when: "$(basename).scss"
        },
        // libs/xplat
        "**/libs/**/*.js": {
          when: "$(basename).ts"
        },
        "**/libs/**/*.d.ts": {
          when: "$(basename).ts"
        },
        "**/xplat/**/*.js": {
          when: "$(basename).ts"
        },
        "**/xplat/**/*.d.ts": {
          when: "$(basename).ts"
        }
      };

      if (isVsCode) {
        const workspaceSettingsPath = join(cwd, ".vscode", "settings.json");
        // console.log('workspaceSettingsPath:',workspaceSettingsPath);
        let workspaceSettingsJson: any = {};
        if (fs.existsSync(workspaceSettingsPath)) {
          const workspaceSettings = fs.readFileSync(
            workspaceSettingsPath,
            "UTF-8"
          );
          workspaceSettingsJson = jsonParse(workspaceSettings);
          const exclude = workspaceSettingsJson["files.exclude"];
          workspaceSettingsJson["files.exclude"] = Object.assign(
            exclude,
            workspaceUpdates
          );
        } else {
          // console.log('creating workspace settings...');
          fs.mkdirSync(".vscode");
          workspaceSettingsJson["files.exclude"] = workspaceUpdates;
        }
        fs.writeFileSync(
          workspaceSettingsPath,
          JSON.stringify(workspaceSettingsJson, null, 2)
        );
      } 

      if (isWebStorm) {

      }

    }
  } catch (err) {
    // console.warn('IDE Settings could not be updated at this time:', err);
  }
  return tree;
}

export function createWebStormProjectView(isExcluding: boolean) {
  const projectViewObject = { 
    application: { 
      component: [ 
        { 
          '$': { 
            name: 'ProjectViewSharedSettings' 
          },
          option: [ 
            webStormExcludedViewNode(isExcluding) 
          ] 
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
    .split("")
    .filter(char => /[a-zA-Z0-9]/.test(char))
    .join("");

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
      return chr ? chr.toUpperCase() : "";
    })
    .replace(/^([A-Z])/, match => match.toLowerCase());
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

function classify(str) {
  return str
    .split(".")
    .map(part => capitalize(camelize(part)))
    .join(".");
}

export const stringUtils = { sanitize, classify, capitalize, camelize };

export const toComponentClassName = (name: string) =>
  `${classify(name)}Component`;

export const toNgModuleClassName = (name: string) => `${classify(name)}Module`;
