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
  noop
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
} from '@nstudio/workspace';
import { Schema } from './schema';
import {
  getDefaultTemplateOptions,
  addLibFiles,
  addPlatformFiles,
  updateTestingConfig,
  updateLint
} from '../../utils';

let platformArg: string;
export default function(options: Schema) {
  const targetPlatforms: ITargetPlatforms = {};
  platformArg = options.platforms || '';
  if (platformArg === 'all') {
    // conveniently add support for all supported platforms
    for (const platform of supportedPlatforms) {
      targetPlatforms[platform] = true;
    }
    platformArg = supportedPlatforms.join(',');
  } else {
    const platforms = sanitizeCommaDelimitedArg(platformArg);
    if (platforms.length === 0) {
      throw new Error(noPlatformError());
    } else {
      for (const platform of platforms) {
        if (supportedPlatforms.includes(platform)) {
          targetPlatforms[platform] = true;
        } else {
          throw new Error(unsupportedPlatformError(platform));
        }
      }
    }
  }

  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      addTestingFiles(tree, options)(tree, context),
    updateTestingConfig,
  ]);
}
