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
const importsToUpdateMapping: PackageNameMapping = {};
const directoriesToUpdateImports: Array<string> = [];
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
    // update imports throughout old lib architecture and apps
    updateImports(),
    // move old structure into new
    moveOldStructureToNew(),
    // update apps
    updateNativeScriptApps(),
    // update root deps
    updateRootDeps(),
    // remove old testing
    deleteTestingDir(),
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
    ['testing']
      .map((dir) => tree.getDir(dir))
      .forEach((projectDir) => {
        projectDir.visit((file) => {
          tree.delete(file);
        });
      });

    return tree;
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
          if (file.indexOf('scss') === -1) {
            srcTarget += '/lib';
          }
          if (file.indexOf('/libs') === 0) {
            const pathTarget = projectDir.path.split('/').pop();
            moveTo = file.replace(
              projectDir.path,
              `/libs/xplat/${pathTarget}${srcTarget}`
            );
          } else if (file.indexOf('/xplat') === 0) {
            moveTo = file.replace(
              projectDir.path,
              `/libs${projectDir.path}${srcTarget}`
            );
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
    tree.delete('tsconfig.json');
    const packagePath = 'package.json';
    const packageJson = getJsonFromFile(tree, packagePath);

    const npmScope = getNpmScope();
    delete packageJson.dependencies[`@${npmScope}/scss`];
    packageJson.dependencies[`@${npmScope}/xplat-scss`] =
      'file:libs/xplat/scss/src';
    delete packageJson.devDependencies[`node-sass`];
    packageJson.devDependencies['sass'] = '~1.30.0';

    for (const key of Object.keys(packageJson.devDependencies)) {
      if (key.indexOf('@nstudio') > -1) {
        packageJson.devDependencies[key] = '11.0.0';
      }
    }

    return updateJsonFile(tree, packagePath, packageJson);
  };
}

export function updateImports() {
  return (tree: Tree, _context: SchematicContext) => {
    // console.log(
    //   'updateImports',
    //   'directoriesToUpdateImports:',
    //   directoriesToUpdateImports
    // );
    const npmScope = getNpmScope();
    directoriesToUpdateImports.push('/apps');
    directoriesToUpdateImports
      .map((dir) => tree.getDir(dir))
      .forEach((projectDir) => {
        projectDir.visit((file) => {
          // only look at .(j|t)s(x) files
          if (!/ts?$/.test(file)) {
            return;
          }
          // if it doesn't contain at least 1 reference to the packages to be renamed bail out
          const contents = tree.read(file).toString('utf-8');
          if (
            !Object.keys(importsToUpdateMapping).some((packageName) =>
              contents.includes(packageName)
            )
          ) {
            return;
          }
          // console.log('updateImports', 'found old import in:', file);

          const astSource = ts.createSourceFile(
            file,
            contents,
            ts.ScriptTarget.Latest,
            true
          );
          const changes = Object.entries(importsToUpdateMapping)
            .map(([packageName, newPackageName]) => {
              if (file.indexOf('apps/') > -1) {
                // ensure core vs. shared is handled
                if (file.indexOf('core.module') > -1) {
                  if (file.indexOf('electron') > -1) {
                    newPackageName = `@${npmScope}/xplat/electron/core`;
                  } else if (file.indexOf('ionic') > -1) {
                    newPackageName = `@${npmScope}/xplat/ionic/core`;
                  } else if (file.indexOf('nativescript') > -1) {
                    newPackageName = `@${npmScope}/xplat/nativescript/core`;
                  } else if (file.indexOf('web') > -1) {
                    newPackageName = `@${npmScope}/xplat/web/core`;
                  }
                } else if (file.indexOf('shared.module') > -1) {
                  if (file.indexOf('electron') > -1) {
                    newPackageName = `@${npmScope}/xplat/electron/features`;
                  } else if (file.indexOf('ionic') > -1) {
                    newPackageName = `@${npmScope}/xplat/ionic/features`;
                  } else if (file.indexOf('nativescript') > -1) {
                    newPackageName = `@${npmScope}/xplat/nativescript/features`;
                  } else if (file.indexOf('web') > -1) {
                    newPackageName = `@${npmScope}/xplat/web/features`;
                  }
                }
              }
              const nodes = findNodes(
                astSource,
                ts.SyntaxKind.ImportDeclaration
              ) as ts.ImportDeclaration[];

              return nodes
                .filter((node) => {
                  return (
                    // remove quotes from module name
                    node.moduleSpecifier.getText().slice(1).slice(0, -1) ===
                    packageName
                  );
                })
                .map(
                  (node) =>
                    new ReplaceChange(
                      file,
                      node.moduleSpecifier.getStart(),
                      node.moduleSpecifier.getText(),
                      `'${newPackageName}'`
                    )
                );
            })
            // .flatMap()/.flat() is not available? So, here's a flat poly
            .reduce((acc, val) => acc.concat(val), []);

          // if the reference to packageName was in fact an import statement
          if (changes.length > 0) {
            // update the file in the tree
            insert(tree, file, changes);
          }
        });
      });
  };
}

function updateNativeScriptApps() {
  return (tree: Tree, context: SchematicContext) => {
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

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }

      if (tree.exists(`${dirPath}/src/app.android.scss`)) {
        let scssUpdate = tree.read(`${dirPath}/src/app.android.scss`)!.toString('utf-8');
        scssUpdate = scssUpdate.replace('/nativescript-scss', '/xplat-nativescript-scss');
        createOrUpdate(tree, `${dirPath}/src/app.android.scss`, scssUpdate);
      }
      if (tree.exists(`${dirPath}/src/app.ios.scss`)) {
        let scssUpdate = tree.read(`${dirPath}/src/app.ios.scss`)!.toString('utf-8');
        scssUpdate = scssUpdate.replace('/nativescript-scss', '/xplat-nativescript-scss');
        createOrUpdate(tree, `${dirPath}/src/app.ios.scss`, scssUpdate);
      }

      tree.delete(`${dirPath}/tsconfig.env.json`);
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
        coverageDirectory: '${relativePath}/coverage/${dirPath}',
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

function getCurrentlyUsedPlatforms(tree: Tree) {
  const platforms = [];
  if (
    tree.exists('/libs/core/index.ts') &&
    tree.exists('/libs/features/index.ts')
  ) {
    const npmScope = getNpmScope();
    importsToUpdateMapping[`@${npmScope}/core`] = `@${npmScope}/xplat/core`;
    importsToUpdateMapping[`@${npmScope}/core/base`] = `@${npmScope}/xplat/core`;
    importsToUpdateMapping[
      `@${npmScope}/features`
    ] = `@${npmScope}/xplat/features`;
    importsToUpdateMapping[`@${npmScope}/utils`] = `@${npmScope}/xplat/utils`;
    if (!directoriesToUpdateImports.includes('/libs/core')) {
      directoriesToUpdateImports.push('/libs/core');
      oldDirectoriesToMove.push('/libs/core');
      newDirectoriesToEmpty.push('/libs/xplat/core/src/lib');
    }
    if (!directoriesToUpdateImports.includes('/libs/features')) {
      directoriesToUpdateImports.push('/libs/features');
      oldDirectoriesToMove.push('/libs/features');
      newDirectoriesToEmpty.push('/libs/xplat/features/src/lib');
    }
    if (!newDirectoriesToEmpty.includes('/libs/xplat/scss/src')) {
      newDirectoriesToEmpty.push('/libs/xplat/scss/src');
      oldDirectoriesToMove.push('/libs/scss');
      createOrUpdate(tree, `/libs/scss/package.json`, `{
        "name": "@${npmScope}/xplat-scss",
        "version": "1.0.0"
      }`);
    }
    if (!newDirectoriesToEmpty.includes('/libs/xplat/utils/src/lib')) {
      newDirectoriesToEmpty.push('/libs/xplat/utils/src/lib');
      oldDirectoriesToMove.push('/libs/utils');
    }
    // collect which platforms were currently used
    if (tree.exists('/xplat/electron/index.ts')) {
      if (!platforms.includes('electron')) {
        platforms.push('electron');
      }
      newDirectoriesToEmpty.push('/libs/xplat/electron/core/src/lib');
      importsToUpdateMapping[
        `@${npmScope}/electron`
      ] = `@${npmScope}/xplat/electron/core`;
      importsToUpdateMapping[
        `@${npmScope}/electron/features`
      ] = `@${npmScope}/xplat/electron/features`;
      importsToUpdateMapping[
        `@${npmScope}/electron/utils`
      ] = `@${npmScope}/xplat/electron/utils`;
      if (!directoriesToUpdateImports.includes('/xplat/electron')) {
        directoriesToUpdateImports.push('/xplat/electron');
        oldDirectoriesToMove.push('/xplat/electron');
      }
    }
    if (tree.exists('/xplat/ionic/index.ts')) {
      if (!platforms.includes('ionic')) {
        platforms.push('ionic');
      }
      if (!newDirectoriesToEmpty.includes('/libs/xplat/ionic/core/src/lib')) {
        newDirectoriesToEmpty.push('/libs/xplat/ionic/core/src/lib');
        oldDirectoriesToMove.push('/xplat/ionic/core');
      }
      if (
        !newDirectoriesToEmpty.includes('/libs/xplat/ionic/features/src/lib')
      ) {
        newDirectoriesToEmpty.push('/libs/xplat/ionic/features/src/lib');
        oldDirectoriesToMove.push('/xplat/ionic/features');
      }
      if (!newDirectoriesToEmpty.includes('/libs/xplat/ionic/scss/src')) {
        newDirectoriesToEmpty.push('/libs/xplat/ionic/scss/src');
        oldDirectoriesToMove.push('/xplat/ionic/scss');
        createOrUpdate(tree, `/xplat/ionic/scss/package.json`, `{
          "name": "@${npmScope}/xplat-ionic-scss",
          "version": "1.0.0"
        }`);
        if (tree.exists(`/xplat/ionic/scss/_index.scss`)) {
          let scssUpdate = tree.read(`/xplat/ionic/scss/_index.scss`)!.toString('utf-8');
          scssUpdate = scssUpdate.replace(`@${npmScope}/scss/index`, `@${npmScope}/xplat-scss/index`);
          createOrUpdate(tree, `/xplat/ionic/scss/_index.scss`, scssUpdate);
        }
      }
      importsToUpdateMapping[
        `@${npmScope}/ionic`
      ] = `@${npmScope}/xplat/ionic/core`;
      importsToUpdateMapping[
        `@${npmScope}/ionic/features`
      ] = `@${npmScope}/xplat/ionic/features`;
      importsToUpdateMapping[
        `@${npmScope}/ionic/utils`
      ] = `@${npmScope}/xplat/ionic/utils`;
      if (!directoriesToUpdateImports.includes('/xplat/ionic')) {
        directoriesToUpdateImports.push('/xplat/ionic');
      }
    }
    if (tree.exists('/xplat/nativescript/index.ts')) {
      if (!platforms.includes('nativescript')) {
        platforms.push('nativescript');
      }
      if (
        !newDirectoriesToEmpty.includes('/libs/xplat/nativescript/core/src/lib')
      ) {
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/core/src/lib');
        oldDirectoriesToMove.push('/xplat/nativescript/core');
      }
      if (
        !newDirectoriesToEmpty.includes(
          '/libs/xplat/nativescript/features/src/lib'
        )
      ) {
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/features/src/lib');
        oldDirectoriesToMove.push('/xplat/nativescript/features');
      }
      if (
        !newDirectoriesToEmpty.includes('/libs/xplat/nativescript/scss/src')
      ) {
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/scss/src');
        oldDirectoriesToMove.push('/xplat/nativescript/scss');
        createOrUpdate(tree, `/xplat/nativescript/scss/package.json`, `{
          "name": "@${npmScope}/xplat-nativescript-scss",
          "version": "1.0.0"
        }`);
        if (tree.exists(`/xplat/nativescript/scss/_common.scss`)) {
          let scssUpdate = tree.read(`/xplat/nativescript/scss/_common.scss`)!.toString('utf-8');
          scssUpdate = scssUpdate.replace(`@${npmScope}/scss/index`, `@${npmScope}/xplat-scss/index`);
          createOrUpdate(tree, `/xplat/nativescript/scss/_common.scss`, scssUpdate);
        }
      }
      if (
        !newDirectoriesToEmpty.includes(
          '/libs/xplat/nativescript/utils/src/lib'
        )
      ) {
        newDirectoriesToEmpty.push('/libs/xplat/nativescript/utils/src/lib');
        oldDirectoriesToMove.push('/xplat/nativescript/utils');
      }
      importsToUpdateMapping[
        `@${npmScope}/nativescript`
      ] = `@${npmScope}/xplat/nativescript/core`;
      importsToUpdateMapping[`@${npmScope}/nativescript/core`] = `@${npmScope}/xplat/nativescript/core`;
      importsToUpdateMapping[
        `@${npmScope}/nativescript/features`
      ] = `@${npmScope}/xplat/nativescript/features`;
      importsToUpdateMapping[
        `@${npmScope}/nativescript/utils`
      ] = `@${npmScope}/xplat/nativescript/utils`;
      if (!directoriesToUpdateImports.includes('/xplat/nativescript')) {
        directoriesToUpdateImports.push('/xplat/nativescript');
      }
    }
    if (tree.exists('/xplat/web/index.ts')) {
      if (!platforms.includes('web')) {
        platforms.push('web');
      }
      if (!newDirectoriesToEmpty.includes('/libs/xplat/web/core/src/lib')) {
        newDirectoriesToEmpty.push('/libs/xplat/web/core/src/lib');
        oldDirectoriesToMove.push('/xplat/web/core');
      }
      if (!newDirectoriesToEmpty.includes('/libs/xplat/web/features/src/lib')) {
        newDirectoriesToEmpty.push('/libs/xplat/web/features/src/lib');
        oldDirectoriesToMove.push('/xplat/web/features');
      }
      if (!newDirectoriesToEmpty.includes('/libs/xplat/web/scss/src')) {
        newDirectoriesToEmpty.push('/libs/xplat/web/scss/src');
        oldDirectoriesToMove.push('/xplat/web/scss');
        createOrUpdate(tree, `/xplat/web/scss/package.json`, `{
          "name": "@${npmScope}/xplat-web-scss",
          "version": "1.0.0"
        }`);
        if (tree.exists(`/xplat/web/scss/_index.scss`)) {
          let scssUpdate = tree.read(`/xplat/web/scss/_index.scss`)!.toString('utf-8');
          scssUpdate = scssUpdate.replace(`@${npmScope}/scss/index`, `@${npmScope}/xplat-scss/index`);
          createOrUpdate(tree, `/xplat/web/scss/_index.scss`, scssUpdate);
        }
      }
      importsToUpdateMapping[
        `@${npmScope}/web`
      ] = `@${npmScope}/xplat/web/core`;
      importsToUpdateMapping[`@${npmScope}/web/core`] = `@${npmScope}/xplat/web/core`;
      importsToUpdateMapping[
        `@${npmScope}/web/features`
      ] = `@${npmScope}/xplat/web/features`;
      importsToUpdateMapping[
        `@${npmScope}/web/utils`
      ] = `@${npmScope}/xplat/web/utils`;
      if (!directoriesToUpdateImports.includes('/xplat/web')) {
        directoriesToUpdateImports.push('/xplat/web');
      }
    }
    return platforms;
  }
  return platforms;
}
