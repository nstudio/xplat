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
  schematic,
  noop,
  externalSchematic
} from '@angular-devkit/schematics';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { updateJsonInTree } from '@nrwl/workspace';
import {
  stringUtils,
  supportedPlatforms,
  ITargetPlatforms,
  prerun,
  getPrefix,
  getNpmScope,
  updateGitIgnore,
  addReferences,
  updatePackageForXplat,
  updatePackageScripts,
  updateIDESettings,
  getJsonFromFile,
  updateJsonFile,
  errorMissingPrefix,
  unsupportedPlatformError,
  formatFiles,
  addTestingFiles,
  noPlatformError,
  sanitizeCommaDelimitedArg,
  hasWebPlatform
} from '@nstudio/xplat';
import { Schema } from './schema';
import {
  getDefaultTemplateOptions,
  addLibFiles,
  addPlatformFiles,
  updateTestingConfig,
  updateLint,
  PlatformTypes,
  FrameworkTypes,
  supportedFrameworks
} from '../../utils';

export default function(options: Schema) {
  const externalChains = [];
  const platformArg = options.platforms || '';
  // frontend framework
  const frameworkArg = options.framework || '';
  const frameworks = <Array<FrameworkTypes>>(
    (<unknown>(
      (frameworkArg === 'all'
        ? supportedFrameworks
        : sanitizeCommaDelimitedArg(frameworkArg))
    ))
  );

  const addChainForPlatform = function(
    platform: PlatformTypes,
    framework?: FrameworkTypes
  ) {
    externalChains.push(
      externalSchematic(
        `@nstudio/${platform}${framework ? `-${framework}` : ''}`,
        'xplat',
        options,
        {
          interactive: false
        }
      )
    );
  };

  if (platformArg === 'all') {
    // conveniently add support for all supported platforms
    if (frameworks.length) {
      for (const framework of frameworks) {
        for (const platform of supportedPlatforms) {
          addChainForPlatform(platform, framework);
        }
      }
    } else {
      for (const platform of supportedPlatforms) {
        addChainForPlatform(platform);
      }
    }
  } else {
    const platforms = <Array<PlatformTypes>>(
      (<unknown>sanitizeCommaDelimitedArg(platformArg))
    );
    if (platforms.length === 0) {
      throw new Error(noPlatformError());
    } else {
      if (frameworks.length) {
        for (const framework of frameworks) {
          for (const platform of platforms) {
            if (supportedPlatforms.includes(platform)) {
              addChainForPlatform(platform, framework);
            } else {
              throw new Error(unsupportedPlatformError(platform));
            }
          }
        }
      } else {
        for (const platform of platforms) {
          if (supportedPlatforms.includes(platform)) {
            addChainForPlatform(platform);
          } else {
            throw new Error(unsupportedPlatformError(platform));
          }
        }
      }
    }
  }

  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      addTestingFiles(tree, options)(tree, context),
    updateTestingConfig
  ]);
}
