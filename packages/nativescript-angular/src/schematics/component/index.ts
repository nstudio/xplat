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
  noop
} from '@angular-devkit/schematics';

import {
  stringUtils,
  supportedPlatforms,
  ITargetPlatforms,
  prerun,
  getPrefix,
  getNpmScope,
  platformAppPrefixError,
  generatorError,
  generateOptionError,
  optionsMissingError,
  unsupportedPlatformError,
  needFeatureModuleError,
  formatFiles
} from '@nstudio/workspace';
import {
  addToFeature,
  adjustBarrelIndex,
  ComponentHelpers
} from '@nstudio/angular';

let componentSettings;
const platform = 'nativescript';
export default function(options: ComponentHelpers.Schema) {
  componentSettings = ComponentHelpers.prepare(options);

  const chains = [];
  if (options.onlyProject) {
    for (const projectName of componentSettings.projectNames) {
      const projectParts = projectName.split('-');
      const platPrefix = projectParts[0];
      const platSuffix = projectParts.pop();
      if (platPrefix === platform || platSuffix === platform) {
        const prefixPath = `apps/${projectName}/src/`;
        const featurePath = `${prefixPath}/features/${
          componentSettings.featureName
        }`;
        const featureModulePath = `${featurePath}/${
          componentSettings.featureName
        }.module.ts`;
        const barrelIndex = `${featurePath}/components/index.ts`;
        // console.log('will adjustProject:', projectName);
        chains.push((tree: Tree, context: SchematicContext) => {
          if (!tree.exists(featureModulePath)) {
            throw new Error(
              needFeatureModuleError(
                featureModulePath,
                componentSettings.featureName,
                projectName,
                true
              )
            );
          }
          return addToFeature(
            'component',
            options,
            prefixPath,
            tree,
          )(tree, context);
        });
        chains.push((tree: Tree, context: SchematicContext) => {
          return adjustBarrelIndex('component', options, barrelIndex, true)(
            tree,
            context
          );
        });
        chains.push((tree: Tree, context: SchematicContext) => {
          return addToFeature('component', options, prefixPath, tree, '_index')(
            tree,
            context
          );
        });
      }
    }
  } else {
    // add component
    chains.push((tree: Tree, context: SchematicContext) => {
      return addToFeature(
        'component',
        options,
        `xplat/${platform}`,
        tree,
        ``,
        true
      )(tree, context);
    });
    if (options.subFolder) {
      // adjust components barrel for subFolder
      chains.push((tree: Tree, context: SchematicContext) => {
        return adjustBarrelIndex(
          'component',
          options,
          `xplat/${platform}/features/${
            componentSettings.featureName
          }/components/${options.subFolder}/index.ts`,
          true
        )(tree, context);
      });
      chains.push((tree: Tree, context: SchematicContext) => {
        return options.needsIndex
          ? addToFeature(
              'component',
              options,
              `xplat/${platform}`,
              tree,
              '_index',
              true
            )(tree, context)
          : noop()(tree, context);
      });
    }
    // adjust overall components barrel
    chains.push((tree: Tree, context: SchematicContext) => {
      return adjustBarrelIndex(
        'component',
        options,
        `xplat/${platform}/features/${
          componentSettings.featureName
        }/components/index.ts`,
        true,
        false,
        true
      )(tree, context);
    });

    chains.push((tree: Tree, context: SchematicContext) => {
      return options.needsIndex
        ? addToFeature(
            'component',
            options,
            `xplat/${platform}`,
            tree,
            '_index'
          )(tree, context)
        : noop()(tree, context);
    });
  }

  return chain([prerun(), ...chains]);
}
