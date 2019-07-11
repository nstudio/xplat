import {
  apply,
  chain,
  url,
  move,
  template,
  mergeWith,
  Tree,
  SchematicContext,
  SchematicsException,
  branchAndMerge,
  // schematic,
  Rule,
  noop,
  externalSchematic
} from '@angular-devkit/schematics';
import {
  addGlobal,
  insert,
  stringUtils,
  supportedPlatforms,
  prerun,
  getPrefix,
  getNpmScope,
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  unsupportedPlatformError,
  formatFiles,
  supportedSandboxPlatforms,
  PlatformTypes,
  createOrUpdate,
  getDefaultTemplateOptions,
  FeatureHelpers
} from '@nstudio/xplat';
import { addToCollection } from '../../utils/ast';
import * as ts from 'typescript';

export default function(options: FeatureHelpers.Schema) {
  const featureSettings = FeatureHelpers.prepare(options);

  const externalChains = [];
  for (const platform of featureSettings.platforms) {
    if (supportedPlatforms.includes(platform)) {
      externalChains.push(
        externalSchematic(`@nstudio/${platform}-angular`, 'feature', options, {
          interactive: false
        })
      );
    } else {
      throw new SchematicsException(unsupportedPlatformError(platform));
    }
  }

  return chain([
    prerun(),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : FeatureHelpers.addFiles(options)(tree, context),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject || !options.createBase || options.onlyModule
        ? noop()(tree, context)
        : FeatureHelpers.addFiles(options, null, null, '_component')(
            tree,
            context
          ),
    // update libs index
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : FeatureHelpers.adjustBarrelIndex(options, 'libs/features/index.ts')(
            tree,
            context
          ),
    // external schematic handling
    ...externalChains,
    options.skipFormat ? noop() : formatFiles(options)
  ]);
}
