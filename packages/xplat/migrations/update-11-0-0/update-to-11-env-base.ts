import {
  chain,
  externalSchematic,
  move,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import {
  createOrUpdate,
  getWorkspace,
  getWorkspacePath,
} from '@nrwl/workspace';
import {
  getJsonFromFile,
  getAppPaths,
  prerun,
  getNpmScope,
  getPrefix,
  getGroupByName,
  updateJsonFile,
  updateFile,
} from '@nstudio/xplat-utils';
import {
  XplatHelpers,
  findNodes,
  ReplaceChange,
  insert,
  updateTsConfig,
} from '@nstudio/xplat';
import * as ts from 'typescript';
import { join } from 'path';
import * as fs from 'fs';

export default function (): Rule {
  return chain([
    prerun(
      {
        framework: 'angular',
      },
      true
    ),
    // add environment base setup to allow workspaces to start using
    addEnvBase(),
    // add envs to {N} apps
    updateEnvsForNativeScript(),
    // update workspace project fileReplacements to use new env locations
    updateWorkspaceFileReplacements(),
  ]);
}

export function addEnvBase() {
  return (tree: Tree, _context: SchematicContext) => {
    const npmScope = getNpmScope();
    const coreIndexPath = `/libs/xplat/core/src/lib/index.ts`;
    let coreIndex = tree.read(coreIndexPath)!.toString('utf-8');
    coreIndex = coreIndex.replace(
      `./environments/environment`,
      `./environments`
    );
    createOrUpdate(tree, coreIndexPath, coreIndex);

    const envInterfacePath = `/libs/xplat/core/src/lib/environments/environment.interface.ts`;
    const envInterface = `/**
    * Workspace shared environment properties
    */
   export interface IEnvironment {
     production?: boolean;
   }`;
    createOrUpdate(tree, envInterfacePath, envInterface);

    const envIndexPath = `/libs/xplat/core/src/lib/environments/index.ts`;
    const envIndex = `export * from './environment.interface';
    export * from './environment';`;
    createOrUpdate(tree, envIndexPath, envIndex);

    const envBasePath = `/libs/xplat/core/src/lib/environments/base/environment.base.ts`;
    const envBase = `import { IEnvironment } from '../environment.interface';

    /**
     * Reduce the most commonly used environment values here
     */
    export const environmentBase: IEnvironment = {
      production: false
    };`;
    createOrUpdate(tree, envBasePath, envBase);

    const envDevPath = `/libs/xplat/core/src/lib/environments/base/environment.dev.ts`;
    const envDev = `import { IEnvironment } from '@${npmScope}/xplat/core';
    import { deepMerge } from '@${npmScope}/xplat/utils';
    import { environmentBase } from './environment.base';
    
    export const environmentDev = deepMerge(environmentBase, <IEnvironment>{
      // customizations here...
    });
    `;
    createOrUpdate(tree, envDevPath, envDev);

    const envProdPath = `/libs/xplat/core/src/lib/environments/base/environment.prod.ts`;
    const envProd = `import { IEnvironment } from '@${npmScope}/xplat/core';
    import { deepMerge } from '@${npmScope}/xplat/utils';
    import { environmentBase } from './environment.base';
    
    export const environmentProd = deepMerge(environmentBase, <IEnvironment>{
      production: true,
      // customizations here...
    });
    `;
    createOrUpdate(tree, envProdPath, envProd);

    const envBaseIndexPath = `/libs/xplat/core/src/lib/environments/base/index.ts`;
    const envBaseIndex = `export * from './environment.base';
    export * from './environment.dev';
    export * from './environment.prod';
    `;
    createOrUpdate(tree, envBaseIndexPath, envBaseIndex);

    const utilsObjPath = `/libs/xplat/utils/src/lib/objects.ts`;
    let utilsObj = '';
    const utilsObjDeepMerge = `\n\nexport function deepMerge<T1, T2>(target: T1, source: T2): T1 & T2 {
      const result: any = {};
      Object.entries(target).forEach(([key, value]) => {
        if (key in source) {
          // potential overwrite
          if (typeof value !== typeof source[key]) {
            // value type mismatch, always take source values.
            result[key] = source[key];
          } else if (isObject(value)) {
            result[key] = deepMerge(value, source[key]);
          } else {
            result[key] = source[key];
          }
        } else {
          result[key] = value;
        }
      });
      Object.entries(source)
        .filter(([key]) => !(key in target))
        .forEach(([key, value]) => {
          result[key] = value;
        });
      return result;
    }`;
    if (tree.exists(utilsObjPath)) {
      utilsObj = tree.read(utilsObjPath)!.toString('utf-8');
    }
    if (utilsObj.indexOf('deepMerge') === -1) {
      utilsObj = utilsObj + utilsObjDeepMerge;
    }
    createOrUpdate(tree, utilsObjPath, utilsObj);
  };
}

export function updateEnvsForNativeScript() {
  return (tree: Tree, _context: SchematicContext) => {
    const nativeScriptAppsPaths = getAppPaths(tree, 'nativescript');
    const npmScope = getNpmScope();
    // update {N} apps and configs
    for (const dirPath of nativeScriptAppsPaths) {
      // console.log(dir);
      // console.log('{N} appDir:', dirPath);
      const relativePath = dirPath
        .split('/')
        .filter((p) => !!p)
        .map((p) => '..')
        .join('/');

      // disable xplat env base handling to make it opt in when ready
      const cwd = process.cwd();
      const webpackConfigPath = join(
        cwd,
        'node_modules/@nstudio/nativescript-angular/src/schematics/application/_files/webpack.config.js'
      );
      // console.log('webpackConfigPath:', webpackConfigPath);
      let webpackConfig = fs.readFileSync(webpackConfigPath, 'UTF-8');
      webpackConfig = webpackConfig.replace(
        'if (isXplatWorkspace) {',
        `// opt in when ready to use in your workspace\n  const xplatEnvBaseEnabled = false;\n  if (xplatEnvBaseEnabled && isXplatWorkspace) {`
      );
      createOrUpdate(tree, `${dirPath}/webpack.config.js`, webpackConfig.replace('<%= pathOffset %>', relativePath));

      createOrUpdate(
        tree,
        `${dirPath}/src/environments/environment.base.ts`,
        `import { IEnvironment } from '@${npmScope}/xplat/core';
          import { deepMerge } from '@${npmScope}/xplat/utils';
          
          export const environmentBase = function (baseWorkspaceEnv: IEnvironment, appEnvironmentCustom: IEnvironment = {}) {
            // base app environment + customizations
            const appEnvironment = deepMerge(
              <IEnvironment>{
                production: baseWorkspaceEnv.production,
                // shared app level customizations here...
              },
              appEnvironmentCustom
            );
            // base workspace environment + target app environment
            return deepMerge(baseWorkspaceEnv, appEnvironment);
          };
          `
      );

      createOrUpdate(
        tree,
        `${dirPath}/src/environments/environment.dev.ts`,
        `import { environmentBase } from './environment.base';
          import { IEnvironment } from '@${npmScope}/xplat/core';
          import { environmentDev } from '@${npmScope}/xplat/environments';
          
          export const environment: IEnvironment = environmentBase(environmentDev, {
            // app level customizations here...
          });
          `
      );

      createOrUpdate(
        tree,
        `${dirPath}/src/environments/environment.prod.ts`,
        `import { environmentBase } from './environment.base';
          import { IEnvironment } from '@${npmScope}/xplat/core';
          import { environmentProd } from '@${npmScope}/xplat/environments';
          
          export const environment: IEnvironment = environmentBase(environmentProd, {
            // app level customizations here...
          });
          `
      );
    }
  };
}

export function updateWorkspaceFileReplacements() {
  return (tree: Tree, _context: SchematicContext) => {
    const workspacePath = getWorkspacePath(tree);
    const workspaceJson = getJsonFromFile(tree, workspacePath);
    if (workspaceJson && workspaceJson.projects) {
      const projectNames = Object.keys(workspaceJson.projects);
      for (const name of projectNames) {
        let targetProp = 'architect';
        if (
          workspaceJson.projects[name] &&
          !workspaceJson.projects[name].architect
        ) {
          targetProp = 'targets';
        }
        if (
          workspaceJson.projects[name] &&
          workspaceJson.projects[name][targetProp]
        ) {
          if (workspaceJson.projects[name][targetProp].build) {
            // update style references
            if (
              workspaceJson.projects[name][targetProp].build.options &&
              workspaceJson.projects[name][targetProp].build.options.styles
            ) {
              for (
                let i = 0;
                i <
                workspaceJson.projects[name][targetProp].build.options.styles
                  .length;
                i++
              ) {
                const styleEntry =
                  workspaceJson.projects[name][targetProp].build.options.styles[
                    i
                  ];
                if (
                  typeof styleEntry === 'string' &&
                  styleEntry.indexOf('xplat/web/scss') > -1 &&
                  styleEntry.indexOf('libs/xplat/web') === -1
                ) {
                  workspaceJson.projects[name][targetProp].build.options.styles[
                    i
                  ] = styleEntry.replace(
                    'xplat/web/scss',
                    'libs/xplat/web/scss/src'
                  );
                } else if (styleEntry && typeof styleEntry === 'object') {
                  if (
                    styleEntry.input &&
                    typeof styleEntry.input === 'string' &&
                    styleEntry.input.indexOf('xplat/web/scss') > -1 &&
                    styleEntry.input.indexOf('libs/xplat/web') === -1
                  ) {
                    workspaceJson.projects[name][
                      targetProp
                    ].build.options.styles[i].input = styleEntry.input.replace(
                      'xplat/web/scss',
                      'libs/xplat/web/scss/src'
                    );
                  }
                }
              }
            }

            // update configuration fileReplacements
            if (workspaceJson.projects[name][targetProp].build.configurations) {
              const configKeys = Object.keys(
                workspaceJson.projects[name][targetProp].build.configurations
              );
              for (const configKey of configKeys) {
                if (
                  workspaceJson.projects[name][targetProp].build.configurations[
                    configKey
                  ].fileReplacements
                ) {
                  let updatedFileReplace;
                  for (
                    let i = 0;
                    i <
                    workspaceJson.projects[name][targetProp].build
                      .configurations[configKey].fileReplacements.length;
                    i++
                  ) {
                    const replaceOption =
                      workspaceJson.projects[name][targetProp].build
                        .configurations[configKey].fileReplacements[i];
                    if (
                      replaceOption.replace &&
                      replaceOption.replace.indexOf('libs/core') > -1
                    ) {
                      if (!updatedFileReplace) {
                        updatedFileReplace = replaceOption;
                      }
                      updatedFileReplace.replace = updatedFileReplace.replace.replace(
                        'libs/core',
                        'libs/xplat/core/src/lib'
                      );
                    }

                    if (
                      replaceOption.with &&
                      replaceOption.with.indexOf('libs/core') > -1
                    ) {
                      if (!updatedFileReplace) {
                        updatedFileReplace = replaceOption;
                      }
                      updatedFileReplace.with = updatedFileReplace.with.replace(
                        'libs/core',
                        'libs/xplat/core/src/lib'
                      );
                    }

                    if (updatedFileReplace) {
                      workspaceJson.projects[name][
                        targetProp
                      ].build.configurations[configKey].fileReplacements[
                        i
                      ] = updatedFileReplace;
                    }
                  }
                }
              }
            }
          }

          // {N}: update configuration fileReplacements
          if (
            workspaceJson.projects[name][targetProp].default &&
            workspaceJson.projects[name][targetProp].default.configurations
          ) {
            const configKeys = Object.keys(
              workspaceJson.projects[name][targetProp].default.configurations
            );
            for (const configKey of configKeys) {
              if (
                workspaceJson.projects[name][targetProp].default.configurations[
                  configKey
                ].fileReplacements
              ) {
                let updatedFileReplace;
                for (
                  let i = 0;
                  i <
                  workspaceJson.projects[name][targetProp].default
                    .configurations[configKey].fileReplacements.length;
                  i++
                ) {
                  const replaceOption =
                    workspaceJson.projects[name][targetProp].default
                      .configurations[configKey].fileReplacements[i];
                  if (
                    replaceOption.replace &&
                    replaceOption.replace.indexOf('libs/core') > -1
                  ) {
                    if (!updatedFileReplace) {
                      updatedFileReplace = replaceOption;
                    }
                    updatedFileReplace.replace = updatedFileReplace.replace.replace(
                      'libs/core',
                      'libs/xplat/core/src/lib'
                    );
                  }

                  if (
                    replaceOption.with &&
                    replaceOption.with.indexOf('libs/core') > -1
                  ) {
                    if (!updatedFileReplace) {
                      updatedFileReplace = replaceOption;
                    }
                    updatedFileReplace.with = updatedFileReplace.with.replace(
                      'libs/core',
                      'libs/xplat/core/src/lib'
                    );
                  }

                  if (updatedFileReplace) {
                    workspaceJson.projects[name][
                      targetProp
                    ].default.configurations[configKey].fileReplacements[
                      i
                    ] = updatedFileReplace;
                  }
                }
              }
            }
          }
        }
      }

      return updateJsonFile(tree, workspacePath, workspaceJson);
    } else {
      return noop();
    }
  };
}
