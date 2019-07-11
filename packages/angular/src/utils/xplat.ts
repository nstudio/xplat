import { Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import {
  generateOptionError,
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  supportedPlatforms,
  PlatformTypes,
  needFeatureModuleError
} from '@nstudio/workspace';
import { addToFeature, adjustBarrelIndex } from './generator';

export namespace ComponentHelpers {
  export interface Schema {
    name: string;
    /**
     * Target feature. Default is 'ui' if none specified.
     */
    feature?: string;
    /**
     * Group it in a subfolder of the target feature
     */
    subFolder?: string;
    /**
     * Target apps
     */
    projects?: string;
    /**
     * Only generate for specified projects and ignore shared code
     */
    onlyProject?: boolean;
    /**
     * Target platforms
     */
    platforms?: string;
    /**
     * Create a base component for maximum cross platform sharing
     */
    createBase?: boolean;
    /**
     * Schematic processing helpers
     */
    needsIndex?: boolean;
    /**
     * Skip formatting
     */
    skipFormat?: boolean;
  }

  export function prepare(
    options: Schema
  ): {
    featureName: string;
    projectNames: Array<string>;
    platforms: Array<PlatformTypes>;
  } {
    if (!options.name) {
      throw new Error(generateOptionError('component'));
    }

    // reset module globals
    options.needsIndex = false;
    let featureName: string;
    let projectNames = null;
    let platforms = [];

    if (options.feature) {
      featureName = options.feature.toLowerCase();
    }
    const projects = options.projects;
    if (projects) {
      options.onlyProject = true;
      if (!featureName) {
        // no feature targeted, default to shared
        featureName = 'shared';
      }
      // building feature in shared code and in projects
      projectNames = projects.split(',');
      for (const name of projectNames) {
        const projectParts = name.split('-');
        const platPrefix = projectParts[0];
        const platSuffix = projectParts.pop();
        if (
          supportedPlatforms.includes(platPrefix) &&
          !platforms.includes(platPrefix)
        ) {
          // if project name is prefixed with supported platform and not already added
          platforms.push(platPrefix);
        } else if (
          supportedPlatforms.includes(platSuffix) &&
          !platforms.includes(platSuffix)
        ) {
          platforms.push(platSuffix);
        }
      }
    } else if (options.platforms) {
      if (!featureName) {
        // no feature targeted, default to ui
        featureName = 'ui';
      }
      // building feature in shared code only
      platforms = options.platforms.split(',');
    }
    if (platforms.length === 0) {
      let error = projects
        ? platformAppPrefixError()
        : generatorError('component');
      throw new Error(optionsMissingError(error));
    }
    return { featureName, projectNames, platforms };
  }

  export function platformGenerator(options: Schema, platform: PlatformTypes) {
    const chains = [];
    const componentSettings = prepare(options);

    if (options.onlyProject) {
      for (const projectName of componentSettings.projectNames) {
        const projectParts = projectName.split('-');
        const platPrefix = projectParts[0];
        const platSuffix = projectParts.pop();
        if (platPrefix === platform || platSuffix === platform) {
          const appDir = platform === 'web' ? '/app' : '';
          const prefixPath = `apps/${projectName}/src${appDir}`;
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
            return addToFeature('component', options, prefixPath, tree)(
              tree,
              context
            );
          });
          chains.push((tree: Tree, context: SchematicContext) => {
            return adjustBarrelIndex('component', options, barrelIndex, true)(
              tree,
              context
            );
          });
          chains.push((tree: Tree, context: SchematicContext) => {
            return addToFeature(
              'component',
              options,
              prefixPath,
              tree,
              '_index'
            )(tree, context);
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

    return chains;
  }
}
