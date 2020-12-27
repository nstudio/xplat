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
const importsToUpdateMapping: PackageNameMapping = {};
export default function (): Rule {
  return chain([
    prerun(
      {
        framework: 'angular',
      },
      true
    ),
    // update imports throughout old lib architecture and apps
    updateImports(),
  ]);
}

export function updateImports() {
  return (tree: Tree, _context: SchematicContext) => {
    const npmScope = getNpmScope();
    importsToUpdateMapping[`@${npmScope}/core`] = `@${npmScope}/xplat/core`;
    importsToUpdateMapping[`@${npmScope}/core/*`] = `@${npmScope}/xplat/core`;
    importsToUpdateMapping[
      `@${npmScope}/features`
    ] = `@${npmScope}/xplat/features`;
    importsToUpdateMapping[
      `@${npmScope}/features/*`
    ] = `@${npmScope}/xplat/features`;
    importsToUpdateMapping[`@${npmScope}/utils`] = `@${npmScope}/xplat/utils`;
    importsToUpdateMapping[`@${npmScope}/utils/*`] = `@${npmScope}/xplat/utils`;
    // collect which platforms were currently used

    importsToUpdateMapping[
      `@${npmScope}/electron`
    ] = `@${npmScope}/xplat/electron/core`;
    importsToUpdateMapping[
      `@${npmScope}/electron/core`
    ] = `@${npmScope}/xplat/electron/core`;
    importsToUpdateMapping[
      `@${npmScope}/electron/core/*`
    ] = `@${npmScope}/xplat/electron/core`;
    importsToUpdateMapping[
      `@${npmScope}/electron/features`
    ] = `@${npmScope}/xplat/electron/features`;
    importsToUpdateMapping[
      `@${npmScope}/electron/features/*`
    ] = `@${npmScope}/xplat/electron/features`;
    importsToUpdateMapping[
      `@${npmScope}/electron/utils`
    ] = `@${npmScope}/xplat/electron/utils`;
    importsToUpdateMapping[
      `@${npmScope}/electron/utils/*`
    ] = `@${npmScope}/xplat/electron/utils`;

    importsToUpdateMapping[
      `@${npmScope}/ionic`
    ] = `@${npmScope}/xplat/ionic/core`;
    importsToUpdateMapping[
      `@${npmScope}/ionic/core`
    ] = `@${npmScope}/xplat/ionic/core`;
    importsToUpdateMapping[
      `@${npmScope}/ionic/core/*`
    ] = `@${npmScope}/xplat/ionic/core`;
    importsToUpdateMapping[
      `@${npmScope}/ionic/features`
    ] = `@${npmScope}/xplat/ionic/features`;
    importsToUpdateMapping[
      `@${npmScope}/ionic/features/*`
    ] = `@${npmScope}/xplat/ionic/features`;
    importsToUpdateMapping[
      `@${npmScope}/ionic/utils`
    ] = `@${npmScope}/xplat/ionic/utils`;
    importsToUpdateMapping[
      `@${npmScope}/ionic/utils/*`
    ] = `@${npmScope}/xplat/ionic/utils`;

    importsToUpdateMapping[
      `@${npmScope}/nativescript`
    ] = `@${npmScope}/xplat/nativescript/core`;
    importsToUpdateMapping[
      `@${npmScope}/nativescript/core`
    ] = `@${npmScope}/xplat/nativescript/core`;
    importsToUpdateMapping[
      `@${npmScope}/nativescript/core/*`
    ] = `@${npmScope}/xplat/nativescript/core`;
    importsToUpdateMapping[
      `@${npmScope}/nativescript/features`
    ] = `@${npmScope}/xplat/nativescript/features`;
    importsToUpdateMapping[
      `@${npmScope}/nativescript/features/*`
    ] = `@${npmScope}/xplat/nativescript/features`;
    importsToUpdateMapping[
      `@${npmScope}/nativescript/utils`
    ] = `@${npmScope}/xplat/nativescript/utils`;
    importsToUpdateMapping[
      `@${npmScope}/nativescript/utils/*`
    ] = `@${npmScope}/xplat/nativescript/utils`;

    importsToUpdateMapping[`@${npmScope}/web`] = `@${npmScope}/xplat/web/core`;
    importsToUpdateMapping[
      `@${npmScope}/web/core`
    ] = `@${npmScope}/xplat/web/core`;
    importsToUpdateMapping[
      `@${npmScope}/web/core/*`
    ] = `@${npmScope}/xplat/web/core`;
    importsToUpdateMapping[
      `@${npmScope}/web/features`
    ] = `@${npmScope}/xplat/web/features`;
    importsToUpdateMapping[
      `@${npmScope}/web/features/*`
    ] = `@${npmScope}/xplat/web/features`;
    importsToUpdateMapping[
      `@${npmScope}/web/utils`
    ] = `@${npmScope}/xplat/web/utils`;
    importsToUpdateMapping[
      `@${npmScope}/web/utils/*`
    ] = `@${npmScope}/xplat/web/utils`;
    // console.log(
    //   'updateImports',
    //   'directoriesToUpdateImports:',
    //   directoriesToUpdateImports
    // );

    ['/libs', '/apps']
      .map((dir) => tree.getDir(dir))
      .forEach((projectDir) => {
        projectDir.visit((file) => {
          // only look at .ts files
          // ignore some directories in various apps
          if (
            !/^.*\.ts$/.test(file) ||
            file.indexOf('/node_modules/') > -1 ||
            file.indexOf('/platforms/ios') > -1 ||
            file.indexOf('/platforms/android') > -1
          ) {
            return;
          }
          // if it doesn't contain at least 1 reference to the packages to be renamed bail out
          const contents = tree.read(file).toString('utf-8');
          if (
            !Object.keys(importsToUpdateMapping).some((packageName) =>
              contents.includes(packageName)
            )
          ) {
            // also check some relative paths which are common
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
                  // remove quotes from module name
                  const rawImportModuleText = node.moduleSpecifier
                    .getText()
                    .slice(1)
                    .slice(0, -1);
                  if (packageName.indexOf('*') > -1) {
                    // replace deep imports
                    return (
                      rawImportModuleText.indexOf(
                        packageName.replace('*', '')
                      ) === 0
                    );
                  } else {
                    // replace exact matches
                    return rawImportModuleText === packageName;
                  }
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

    return tree;
  };
}
