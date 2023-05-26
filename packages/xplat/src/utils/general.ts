import {
  SchematicsException,
  Tree as NgTree,
  SchematicContext,
} from '@angular-devkit/schematics';
import { stringUtils as nxStringUtils } from '@nx/workspace';
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
import { join, relative } from 'path';
import type { Mode } from 'fs';
import type {
  FileChange,
  Tree as DevKitTree,
  TreeWriteOptions,
} from 'nx/src/generators/tree';

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
  tree: NgTree,
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
      const devDependencies = {
        'jasmine-marbles': '~0.6.0',
      };

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
  tree: NgTree,
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

export function updatePackageScripts(tree: NgTree, scripts: any) {
  const path = 'package.json';
  const packageJson = getJsonFromFile(tree, path);
  const scriptsMap = Object.assign({}, packageJson.scripts);
  packageJson.scripts = Object.assign(scriptsMap, scripts);
  return updateJsonFile(tree, path, packageJson);
}

export function readWorkspaceJson(tree: NgTree) {
  return getJsonFromFile(tree, 'workspace.json');
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

export const actionToFileChangeMap = {
  c: 'CREATE',
  o: 'UPDATE',
  d: 'DELETE',
};

class RunCallbackTask {
  constructor(private callback: any) {}

  toConfiguration() {
    return {
      name: 'RunCallback',
      options: {
        callback: this.callback,
      },
    };
  }
}

function createRunCallbackTask() {
  return {
    name: 'RunCallback',
    create: () => {
      return Promise.resolve(async ({ callback }: { callback: any }) => {
        await callback();
      });
    },
  };
}

export function convertNgTreeToDevKit(tree: NgTree, context: any): DevkitTreeFromAngularDevkitTree {
  if (context.engine.workflow) {
    const engineHost = (context.engine.workflow as any).engineHost;
    engineHost.registerTaskExecutor(createRunCallbackTask());
  }

  const root =
    context.engine.workflow && context.engine.workflow.engineHost.paths
      ? context.engine.workflow.engineHost.paths[1]
      : tree.root.path;

  return new DevkitTreeFromAngularDevkitTree(tree, root, true);
}

export class DevkitTreeFromAngularDevkitTree implements DevKitTree {
  private configFileName: string;

  constructor(
    public tree: NgTree,
    private _root: any,
    private skipWritingConfigInOldFormat?: boolean
  ) {
    /**
     * When using the UnitTestTree from @angular-devkit/schematics/testing, the root is just `/`.
     * This causes a massive issue if `getProjects()` is used in the underlying generator because it
     * causes fast-glob to be set to work on the user's entire file system.
     *
     * Therefore, in this case, patch the root to match what Nx Devkit does and use /virtual instead.
     */
    try {
      const { UnitTestTree } = require('@angular-devkit/schematics/testing');
      if (tree instanceof UnitTestTree && _root === '/') {
        this._root = '/virtual';
      }
    } catch {}
  }

  get root() {
    return this._root;
  }

  children(dirPath: string): string[] {
    const { subdirs, subfiles } = this.tree.getDir(dirPath);
    return [...subdirs, ...subfiles];
  }

  delete(filePath: string): void {
    this.tree.delete(filePath);
  }

  exists(filePath: string): boolean {
    if (this.isFile(filePath)) {
      return this.tree.exists(filePath);
    } else {
      return this.children(filePath).length > 0;
    }
  }

  isFile(filePath: string): boolean {
    return this.tree.exists(filePath) && !!this.tree.read(filePath);
  }

  listChanges(): FileChange[] {
    const fileChanges = [];
    for (const action of this.tree.actions) {
      if (action.kind === 'r') {
        fileChanges.push({
          path: this.normalize(action.to),
          type: 'CREATE',
          content: this.read(action.to),
        });
        fileChanges.push({
          path: this.normalize(action.path),
          type: 'DELETE',
          content: null,
        });
      } else if (action.kind === 'c' || action.kind === 'o') {
        fileChanges.push({
          path: this.normalize(action.path),
          type: actionToFileChangeMap[action.kind],
          content: action.content,
        });
      } else {
        fileChanges.push({
          path: this.normalize(action.path),
          type: 'DELETE',
          content: null,
        });
      }
    }
    return fileChanges;
  }

  private normalize(path: string): string {
    return relative(this.root, join(this.root, path));
  }

  read(filePath: string): Buffer;
  read(filePath: string, encoding: BufferEncoding): string;
  read(filePath: string, encoding?: BufferEncoding) {
    return encoding
      ? this.tree.read(filePath).toString(encoding)
      : this.tree.read(filePath);
  }

  rename(from: string, to: string): void {
    this.tree.rename(from, to);
  }

  write(
    filePath: string,
    content: Buffer | string,
    options?: TreeWriteOptions
  ): void {
    if (options?.mode) {
      this.warnUnsupportedFilePermissionsChange(filePath, options.mode);
    }

    if (this.tree.exists(filePath)) {
      this.tree.overwrite(filePath, content);
    } else {
      this.tree.create(filePath, content);
    }
  }

  changePermissions(filePath: string, mode: Mode): void {
    this.warnUnsupportedFilePermissionsChange(filePath, mode);
  }

  private warnUnsupportedFilePermissionsChange(filePath: string, mode: Mode) {
    console.log(`The Angular DevKit tree does not support changing a file permissions.
                    Ignoring changing ${filePath} permissions to ${mode}.`);
  }
}
