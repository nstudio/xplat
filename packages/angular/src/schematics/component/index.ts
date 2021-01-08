import {
  apply,
  chain,
  url,
  move,
  template,
  mergeWith,
  Tree,
  SchematicContext,
  // SchematicsException,
  branchAndMerge,
  // schematic,
  // Rule,
  noop,
  externalSchematic,
} from '@angular-devkit/schematics';

import {
  stringUtils,
  platformAppPrefixError,
  generatorError,
  generateOptionError,
  optionsMissingError,
  unsupportedPlatformError,
  XplatComponentHelpers,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getJsonFromFile,
  updateJsonFile,
  supportedPlatforms,
  ITargetPlatforms,
} from '@nstudio/xplat-utils';
import { formatFiles } from '@nrwl/workspace';
import { addToFeature, adjustBarrelIndex } from '@nstudio/angular';
import { ComponentHelpers } from '../../utils/xplat';

let componentSettings;
export default function (options: XplatComponentHelpers.Schema) {
  componentSettings = XplatComponentHelpers.prepare(options);

  const externalChains = [];

  for (const platform of componentSettings.platforms) {
    if (supportedPlatforms.includes(platform)) {
      externalChains.push((tree: Tree, context: SchematicContext) =>
        externalSchematic(
          `@nstudio/${platform}-angular`,
          'component',
          options,
          {
            interactive: false,
          }
        )
      );
    } else {
      throw new Error(unsupportedPlatformError(platform));
    }
  }

  // if (externalChains.length === 0) {
  //   // none specified, insert noop
  //   externalChains.push(noop());
  // }

  return chain([
    prerun(),
    // add component for base libs feature
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && options.createBase
        ? addToFeature(
            '',
            'component',
            options,
            'libs/xplat',
            tree,
            '_base',
            true
          )(tree, context)
        : noop()(tree, context),
    // adjust libs barrel for subFolder
    (tree: Tree, context: SchematicContext) =>
      options.subFolder && !options.onlyProject && options.createBase
        ? adjustBarrelIndex(
            'component',
            options,
            `libs/xplat/features/src/lib/${componentSettings.featureName}/base/${options.subFolder}/index.ts`,
            false,
            true
          )(tree, context)
        : noop()(tree, context),
    // add index barrel if needed for subFolder
    (tree: Tree, context: SchematicContext) =>
      options.needsIndex
        ? addToFeature(
            '',
            'component',
            options,
            'libs/xplat',
            tree,
            '_base_index',
            true
          )(tree, context)
        : noop()(tree, context),
    // adjust libs barrel
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && options.createBase
        ? adjustBarrelIndex(
            'component',
            options,
            `libs/xplat/features/src/lib/${componentSettings.featureName}/base/index.ts`,
            false,
            true
          )(tree, context)
        : noop()(tree, context),
    // add index barrel if needed
    (tree: Tree, context: SchematicContext) =>
      options.needsIndex
        ? addToFeature(
            '',
            'component',
            options,
            'libs/xplat',
            tree,
            '_base_index'
          )(tree, context)
        : noop()(tree, context),

    // add platform chains
    (tree: Tree, context: SchematicContext) => chain(externalChains),
    formatFiles({ skipFormat: options.skipFormat }),
  ]);
}
