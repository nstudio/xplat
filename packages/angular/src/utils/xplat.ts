import {
  generateOptionError,
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  supportedPlatforms,
  PlatformTypes
} from '@nstudio/workspace';

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
}
