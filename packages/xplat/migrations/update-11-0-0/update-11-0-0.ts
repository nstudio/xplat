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
// import xplatAngular from '@nstudio/angular/src/schematics/xplat/index';
import * as ts from 'typescript';
import { join } from 'path';
import * as fs from 'fs';

export interface PackageNameMapping {
  [packageName: string]: string;
}

const options: XplatHelpers.Schema = {};
const oldDirectoriesToMove: Array<string> = [];
const newDirectoriesToEmpty: Array<string> = [];
let platforms: Array<string>;
export default function (): Rule {
  return chain([
    prerun(
      {
        framework: 'angular',
      },
      true
    ),
    // generate new xplat libs
    // NOTE: this did not work with Nx 11 -
    // calling externalSchematic's from outside collections do not seem to work (not sure if expected or not from running Nx migrations)
    // This may have worked better being split into a migration by itself with no other rules in the chain
    // (tree: Tree, context: SchematicContext) => {
    //   platforms = getCurrentlyUsedPlatforms(tree);
    //   console.log('generating libs for platforms:', platforms);
    //   if (platforms.length) {
    //     return xplatAngular({
    //       platforms: platforms.join(','),
    //       framework: 'angular',
    //       npmScope: getNpmScope(),
    //       prefix: getPrefix(),
    //       skipFormat: true,
    //       useXplat: true,
    //       groupByName: getGroupByName(),
    //     });
    //   } else {
    //     return noop()(tree, context);
    //   }
    // },
    // clear the new libs and prepare to move existing into it
    emptyNewStructure(),
    // move old structure into new
    moveOldStructureToNew(),
    // update apps
    updateAppConfigs(),
    // update root deps
    updateRootDeps(),
    // remove old testing
    deleteTestingDir(),
    // cleanup gitignore
    cleanupGitIgnore(),
    // remove old nx projects
    (tree: Tree) => {
      const path = 'nx.json';
      const nxJson = getJsonFromFile(tree, path);
      if (nxJson && nxJson.projects) {
        delete nxJson.projects['libs'];
        delete nxJson.projects['xplat'];
        return updateJsonFile(tree, path, nxJson);
      } else {
        return noop();
      }
    },
    // remove old workspace projects
    (tree: Tree) => {
      const workspacePath = getWorkspacePath(tree);
      const workspaceJson = getJsonFromFile(tree, workspacePath);
      if (workspaceJson && workspaceJson.projects) {
        delete workspaceJson.projects['libs'];
        delete workspaceJson.projects['xplat'];
        return updateJsonFile(tree, workspacePath, workspaceJson);
      } else {
        return noop();
      }
    },
    // remove old tsconfig settings
    (tree: Tree, context: SchematicContext) => {
      return updateTsConfig(tree, (tsConfig: any) => {
        if (tsConfig) {
          if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
          }
          const npmScope = getNpmScope();
          delete tsConfig.compilerOptions.paths[`@${npmScope}/*`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/electron`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/electron/*`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/ionic`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/ionic/*`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/nativescript`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/nativescript/*`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/web`];
          delete tsConfig.compilerOptions.paths[`@${npmScope}/web/*`];
          if (tsConfig.includes && tsConfig.includes.length) {
            // find index of xplat entries
            const xplatIndex = (<Array<string>>tsConfig.includes).findIndex(
              (v) => v.indexOf('xplat') > -1
            );
            if (xplatIndex > -1) {
              (<Array<string>>tsConfig.includes).splice(xplatIndex, 1);
            }
          }
          if (tsConfig.exclude && tsConfig.exclude.length) {
            // find index of xplat entries
            const xplatIndex = (<Array<string>>tsConfig.exclude).findIndex(
              (v) => v.indexOf('nativescript') > -1
            );
            if (xplatIndex > -1) {
              (<Array<string>>tsConfig.exclude).splice(xplatIndex, 1);
            }
          }
        }
      });
    },
  ]);
}

function emptyNewStructure() {
  return (tree: Tree, context: SchematicContext) => {
    platforms = getCurrentlyUsedPlatforms(tree);
    newDirectoriesToEmpty
      .map((dir) => tree.getDir(dir))
      .forEach((projectDir) => {
        projectDir.visit((file) => {
          // console.log('emptyNewStructure', ' DELETE ', file);
          tree.delete(file);
        });
      });

    return tree;
  };
}

function deleteTestingDir() {
  return (tree: Tree, context: SchematicContext) => {
    if (
      tree.exists('/testing/test.libs.ts') ||
      tree.exists('/testing/jest.libs.config.js')
    ) {
      ['testing']
        .map((dir) => tree.getDir(dir))
        .forEach((projectDir) => {
          projectDir.visit((file) => {
            tree.delete(file);
          });
        });

      return tree;
    } else {
      return noop();
    }
  };
}

function moveOldStructureToNew() {
  return (tree: Tree, context: SchematicContext) => {
    oldDirectoriesToMove
      .map((dir) => tree.getDir(dir))
      .forEach((projectDir) => {
        projectDir.visit((file) => {
          let moveTo: string;
          let srcTarget = '/src';
          if (file.indexOf('/scss') === -1) {
            srcTarget += '/lib';
          }
          if (file.indexOf('/libs') === 0) {
            const pathTarget = projectDir.path.split('/').pop();
            moveTo = file.replace(
              projectDir.path,
              `/libs/xplat/${pathTarget}${srcTarget}`
            );
          } else if (file.indexOf('/xplat') === 0) {
            if (file.indexOf('/plugins') > -1) {
              moveTo = file.replace(projectDir.path, `/libs${projectDir.path}`);
            } else {
              moveTo = file.replace(
                projectDir.path,
                `/libs${projectDir.path}${srcTarget}`
              );
            }
          }
          // console.log('moveOldStructureToNew', ' rename ', file);
          // console.log('moveOldStructureToNew', ' moveTo ', moveTo);
          tree.rename(file, moveTo);
        });
      });

    return tree;
  };
}

function updateRootDeps() {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists('tsconfig.json')) {
      tree.delete('tsconfig.json');
    }
    const packagePath = 'package.json';
    const packageJson = getJsonFromFile(tree, packagePath);

    const npmScope = getNpmScope();
    delete packageJson.dependencies[`@${npmScope}/scss`];
    packageJson.dependencies[`@${npmScope}/xplat-scss`] =
      'file:libs/xplat/scss/src';
    delete packageJson.devDependencies[`node-sass`];
    packageJson.devDependencies['sass'] = '~1.30.0';

    // look for file ref'd plugins from xplat and update path
    for (const packageName of Object.keys(packageJson.dependencies)) {
      const packageVersion = packageJson.dependencies[packageName];
      if (packageVersion && packageVersion.indexOf('file:xplat') > -1) {
        packageJson.dependencies[packageName] = packageVersion.replace(
          'file:xplat',
          'file:libs/xplat'
        );
      }
    }

    return updateJsonFile(tree, packagePath, packageJson);
  };
}

function updateAppConfigs() {
  return (tree: Tree, context: SchematicContext) => {
    const webAppsPaths = getAppPaths(tree, 'web');
    for (const dirPath of webAppsPaths) {
      const relativePath = dirPath
        .split('/')
        .filter((p) => !!p)
        .map((p) => '..')
        .join('/');

      let customOptionsAppend = '';
      if (tree.exists(`${dirPath}/tsconfig.json`)) {
        const tsConfig = getJsonFromFile(tree, `${dirPath}/tsconfig.json`);
        if (tsConfig.angularCompilerOptions) {
          customOptionsAppend = `,\n"angularCompilerOptions": ${JSON.stringify(
            tsConfig.angularCompilerOptions
          )}`;
        }
      }

      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.json`,
        `{
  "extends": "${relativePath}/tsconfig.base.json",
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    },
    {
      "path": "./tsconfig.editor.json"
    }
  ]
}`
      );

      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.app.json`,
        `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "${relativePath}/dist/out-tsc",
    "types": []
  },
  "files": [
    "src/main.ts",
    "src/polyfills.ts"
  ],
  "include": [
    "src/test.ts"
  ],
  "exclude": [
    "src/test-setup.ts",
    "**/*.spec.ts"
  ]${customOptionsAppend}
}  
      `
      );

      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.editor.json`,
        `{
  "extends": "./tsconfig.json",
  "include": ["**/*.ts"],
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
        `
      );

      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.spec.json`,
        `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "${relativePath}/dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "files": ["src/test-setup.ts"],
  "include": ["**/*.spec.ts", "**/*.d.ts"]
}        
        `
      );
    }

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

      const cwd = process.cwd();
      const webpackConfigPath = join(
        cwd,
        'node_modules/@nstudio/nativescript-angular/src/schematics/application/_files/webpack.config.js'
      );
      // console.log('webpackConfigPath:', webpackConfigPath);
      const webpackConfig = fs.readFileSync(webpackConfigPath, 'UTF-8');
      createOrUpdate(tree, `${dirPath}/webpack.config.js`, webpackConfig);

      // update {N} app deps
      const packagePath = `${dirPath}/package.json`;
      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        delete packageJson.dependencies[`@${npmScope}/scss`];
        delete packageJson.dependencies[`@${npmScope}/nativescript-scss`];
        delete packageJson.dependencies[`@${npmScope}/nativescript`];
        const updatedDeps: any = {};
        updatedDeps[
          `@${npmScope}/xplat-nativescript-scss`
        ] = `file:${relativePath}/libs/xplat/nativescript/scss/src`;
        updatedDeps[
          `@${npmScope}/xplat-scss`
        ] = `file:${relativePath}/libs/xplat/scss/src`;
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...updatedDeps,
        };

        // look for file ref'd plugins from xplat and update path
        for (const packageName of Object.keys(packageJson.dependencies)) {
          const packageVersion = packageJson.dependencies[packageName];
          if (packageVersion && packageVersion.indexOf('../xplat') > -1) {
            packageJson.dependencies[packageName] = packageVersion.replace(
              '../xplat',
              '../libs/xplat'
            );
          }
        }

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }

      const gitIgnorePath = `${dirPath}/.gitignore`;
      let gitIgnore = tree.get(gitIgnorePath).content.toString();
      if (gitIgnore) {
        gitIgnore = gitIgnore.replace('*.js', '*.js\n!jest.config.js');
        tree.overwrite(gitIgnorePath, gitIgnore);
      }

      if (tree.exists(`${dirPath}/src/app.android.scss`)) {
        let scssUpdate = tree
          .read(`${dirPath}/src/app.android.scss`)!
          .toString('utf-8');
        scssUpdate = scssUpdate.replace(
          '/nativescript-scss',
          '/xplat-nativescript-scss'
        );
        createOrUpdate(tree, `${dirPath}/src/app.android.scss`, scssUpdate);
      }
      if (tree.exists(`${dirPath}/src/app.ios.scss`)) {
        let scssUpdate = tree
          .read(`${dirPath}/src/app.ios.scss`)!
          .toString('utf-8');
        scssUpdate = scssUpdate.replace(
          '/nativescript-scss',
          '/xplat-nativescript-scss'
        );
        createOrUpdate(tree, `${dirPath}/src/app.ios.scss`, scssUpdate);
      }

      if (tree.exists(`${dirPath}/tsconfig.env.json`)) {
        tree.delete(`${dirPath}/tsconfig.env.json`);
      }
      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.app.json`,
        `{
        "extends": "./tsconfig.json",
        "compilerOptions": {
          "outDir": "${relativePath}/dist/out-tsc",
          "types": []
        },
        "files": [
          "./references.d.ts",
          "./src/main.ts"
        ]
      }`
      );
      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.editor.json`,
        `{
        "extends": "./tsconfig.json",
        "include": ["**/*.ts"],
        "compilerOptions": {
          "types": ["jest", "node"]
        }
      }
      `
      );
      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.json`,
        `{
        "extends": "${relativePath}/tsconfig.base.json",
        "files": [],
        "include": [],
        "references": [
          {
            "path": "./tsconfig.app.json"
          },
          {
            "path": "./tsconfig.spec.json"
          },
          {
            "path": "./tsconfig.editor.json"
          }
        ]
      }      
      `
      );
      createOrUpdate(
        tree,
        `${dirPath}/tsconfig.spec.json`,
        `{
        "extends": "./tsconfig.json",
        "compilerOptions": {
          "outDir": "${relativePath}/dist/out-tsc",
          "module": "commonjs",
          "types": ["jest", "node"]
        },
        "files": ["src/test-setup.ts"],
        "include": ["**/*.spec.ts", "**/*.d.ts"]
      }      
      `
      );
      createOrUpdate(
        tree,
        `${dirPath}/src/test-setup.ts`,
        `import 'jest-preset-angular';`
      );
      createOrUpdate(
        tree,
        `${dirPath}/references.d.ts`,
        `/// <reference path="${relativePath}/references.d.ts" />`
      );
      createOrUpdate(
        tree,
        `${dirPath}/jest.config.js`,
        `module.exports = {
        preset: '${relativePath}/jest.preset.js',
        setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
        globals: {
          'ts-jest': {
            tsConfig: '<rootDir>/tsconfig.spec.json',
            stringifyContentPathRegex: '\\.(html|svg)$',
            astTransformers: [
              'jest-preset-angular/build/InlineFilesTransformer',
              'jest-preset-angular/build/StripStylesTransformer'
            ]
          }
        },
        coverageDirectory: '${relativePath}/coverage${dirPath}',
        snapshotSerializers: [
          'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
          'jest-preset-angular/build/AngularSnapshotSerializer.js',
          'jest-preset-angular/build/HTMLCommentSerializer.js'
        ],
        displayName: '${dirPath.split('/').pop()}'
      };
      `
      );
      createOrUpdate(
        tree,
        `${dirPath}/.eslintrc.json`,
        `{
        "extends": "${relativePath}/.eslintrc.json",
        "ignorePatterns": [
          "!**/*"
        ],
        "overrides": [
          {
            "files": [
              "*.ts"
            ],
            "extends": [
              "plugin:@nrwl/nx/angular",
              "plugin:@angular-eslint/template/process-inline-templates"
            ],
            "parserOptions": {
              "project": [
                "${dirPath}/tsconfig.*?.json"
              ]
            },
            "rules": {
              "@angular-eslint/directive-selector": [
                "error",
                {
                  "type": "attribute",
                  "prefix": "nar",
                  "style": "camelCase"
                }
              ],
              "@angular-eslint/component-selector": [
                "error",
                {
                  "type": "element",
                  "prefix": "nar",
                  "style": "kebab-case"
                }
              ]
            }
          },
          {
            "files": [
              "*.html"
            ],
            "extends": [
              "plugin:@nrwl/nx/angular-template"
            ],
            "rules": {}
          }
        ]
      }
      `
      );
    }

    return tree;
  };
}

function cleanupGitIgnore() {
  return (tree: Tree) => {
    const gitIgnorePath = '.gitignore';
    let gitIgnore = tree.get(gitIgnorePath).content.toString();
    if (gitIgnore) {
      gitIgnore = gitIgnore.replace('# libs', '');
      gitIgnore = gitIgnore.replace('libs/**/*.js', '');
      gitIgnore = gitIgnore.replace('libs/**/*.map', '');
      gitIgnore = gitIgnore.replace('libs/**/*.d.ts', '');
      gitIgnore = gitIgnore.replace('libs/**/*.metadata.json', '');
      gitIgnore = gitIgnore.replace('libs/**/*.ngfactory.ts', '');
      gitIgnore = gitIgnore.replace('libs/**/*.ngsummary.json', '');

      gitIgnore = gitIgnore.replace('xplat/**/*.js', '');
      gitIgnore = gitIgnore.replace('xplat/**/*.map', '');
      gitIgnore = gitIgnore.replace('xplat/**/*.d.ts', '');
      gitIgnore = gitIgnore.replace('xplat/**/*.metadata.json', '');
      gitIgnore = gitIgnore.replace('xplat/**/*.ngfactory.ts', '');
      gitIgnore = gitIgnore.replace('xplat/**/*.ngsummary.json', '');
    }

    return updateFile(tree, gitIgnorePath, gitIgnore);
  };
}

function getCurrentlyUsedPlatforms(tree: Tree) {
  const platforms = [];
  if (
    tree.exists('/libs/core/index.ts') &&
    tree.exists('/libs/features/index.ts')
  ) {
    const npmScope = getNpmScope();
    if (!oldDirectoriesToMove.includes('/libs/core')) {
      oldDirectoriesToMove.push('/libs/core');
      newDirectoriesToEmpty.push('/libs/xplat/core/src/lib');
    }
    if (!oldDirectoriesToMove.includes('/libs/features')) {
      oldDirectoriesToMove.push('/libs/features');
      newDirectoriesToEmpty.push('/libs/xplat/features/src/lib');
    }
    if (!oldDirectoriesToMove.includes('/libs/scss')) {
      oldDirectoriesToMove.push('/libs/scss');
      newDirectoriesToEmpty.push('/libs/xplat/scss/src');
      createOrUpdate(
        tree,
        `/libs/scss/package.json`,
        `{
        "name": "@${npmScope}/xplat-scss",
        "version": "1.0.0"
      }`
      );
    }
    if (!oldDirectoriesToMove.includes('/libs/utils')) {
      oldDirectoriesToMove.push('/libs/utils');
      newDirectoriesToEmpty.push('/libs/xplat/utils/src/lib');
    }
    // collect which platforms were currently used
    if (tree.exists('/xplat/electron/index.ts')) {
      if (!platforms.includes('electron')) {
        platforms.push('electron');
      }
      if (!oldDirectoriesToMove.includes('/xplat/electron')) {
        oldDirectoriesToMove.push('/xplat/electron');
        newDirectoriesToEmpty.push('/libs/xplat/electron/core/src/lib');
      }
    }
    if (tree.exists('/xplat/ionic/index.ts')) {
      if (!platforms.includes('ionic')) {
        platforms.push('ionic');
      }
      if (!oldDirectoriesToMove.includes('/xplat/ionic/core')) {
        oldDirectoriesToMove.push('/xplat/ionic/core');
        newDirectoriesToEmpty.push('/libs/xplat/ionic/core/src/lib');
      }
      if (!oldDirectoriesToMove.includes('/xplat/ionic/features')) {
        oldDirectoriesToMove.push('/xplat/ionic/features');
        newDirectoriesToEmpty.push('/libs/xplat/ionic/features/src/lib');
      }
      if (!oldDirectoriesToMove.includes('/xplat/ionic/scss')) {
        oldDirectoriesToMove.push('/xplat/ionic/scss');
        newDirectoriesToEmpty.push('/libs/xplat/ionic/scss/src');
        createOrUpdate(
          tree,
          `/xplat/ionic/scss/package.json`,
          `{
          "name": "@${npmScope}/xplat-ionic-scss",
          "version": "1.0.0"
        }`
        );
        if (tree.exists(`/xplat/ionic/scss/_index.scss`)) {
          let scssUpdate = tree
            .read(`/xplat/ionic/scss/_index.scss`)!
            .toString('utf-8');
          scssUpdate = scssUpdate.replace(
            `@${npmScope}/scss/index`,
            `@${npmScope}/xplat-scss/index`
          );
          createOrUpdate(tree, `/xplat/ionic/scss/_index.scss`, scssUpdate);
        }
      }
    }
    if (tree.exists('/xplat/nativescript/index.ts')) {
      if (!platforms.includes('nativescript')) {
        platforms.push('nativescript');
      }
      if (!oldDirectoriesToMove.includes('/xplat/nativescript/core')) {
        oldDirectoriesToMove.push('/xplat/nativescript/core');
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/core/src/lib');
      }
      if (!oldDirectoriesToMove.includes('/xplat/nativescript/features')) {
        oldDirectoriesToMove.push('/xplat/nativescript/features');
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/features/src/lib');
      }
      if (!oldDirectoriesToMove.includes('/xplat/nativescript/plugins')) {
        oldDirectoriesToMove.push('/xplat/nativescript/plugins');
      }
      if (!oldDirectoriesToMove.includes('/xplat/nativescript/scss')) {
        oldDirectoriesToMove.push('/xplat/nativescript/scss');
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/scss/src');
        createOrUpdate(
          tree,
          `/xplat/nativescript/scss/package.json`,
          `{
          "name": "@${npmScope}/xplat-nativescript-scss",
          "version": "1.0.0"
        }`
        );
        if (tree.exists(`/xplat/nativescript/scss/_common.scss`)) {
          let scssUpdate = tree
            .read(`/xplat/nativescript/scss/_common.scss`)!
            .toString('utf-8');
          scssUpdate = scssUpdate.replace(
            `@${npmScope}/scss/index`,
            `@${npmScope}/xplat-scss/index`
          );
          createOrUpdate(
            tree,
            `/xplat/nativescript/scss/_common.scss`,
            scssUpdate
          );
        }
      }
      if (!oldDirectoriesToMove.includes('/xplat/nativescript/utils')) {
        oldDirectoriesToMove.push('/xplat/nativescript/utils');
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/utils/src/lib');
      }
    }
    if (tree.exists('/xplat/web/index.ts')) {
      if (!platforms.includes('web')) {
        platforms.push('web');
      }
      if (!oldDirectoriesToMove.includes('/xplat/web/core')) {
        oldDirectoriesToMove.push('/xplat/web/core');
        newDirectoriesToEmpty.push('/libs/xplat/web/core/src/lib');
      }
      if (!oldDirectoriesToMove.includes('/xplat/web/features')) {
        oldDirectoriesToMove.push('/xplat/web/features');
        newDirectoriesToEmpty.push('/libs/xplat/web/features/src/lib');
      }
      if (!oldDirectoriesToMove.includes('/xplat/web/plugins')) {
        oldDirectoriesToMove.push('/xplat/web/plugins');
      }
      if (!oldDirectoriesToMove.includes('/xplat/web/scss')) {
        oldDirectoriesToMove.push('/xplat/web/scss');
        newDirectoriesToEmpty.push('/libs/xplat/web/scss/src');
        createOrUpdate(
          tree,
          `/xplat/web/scss/package.json`,
          `{
          "name": "@${npmScope}/xplat-web-scss",
          "version": "1.0.0"
        }`
        );
        if (tree.exists(`/xplat/web/scss/_index.scss`)) {
          let scssUpdate = tree
            .read(`/xplat/web/scss/_index.scss`)!
            .toString('utf-8');
          scssUpdate = scssUpdate.replace(
            `@${npmScope}/scss/index`,
            `@${npmScope}/xplat-scss/index`
          );
          createOrUpdate(tree, `/xplat/web/scss/_index.scss`, scssUpdate);
        }
      }
    }
    return platforms;
  }
  return platforms;
}
