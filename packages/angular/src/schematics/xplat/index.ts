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
  hasWebPlatform,
  getDefaultTemplateOptions,
  addLibFiles,
  addPlatformFiles,
  updateTestingConfig,
  updateLint,
  PlatformTypes
} from '@nstudio/xplat';
import { Schema } from './schema';

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
    const platforms = <Array<PlatformTypes>>(<unknown>sanitizeCommaDelimitedArg(platformArg));
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
  // console.log(`Generating xplat support for: ${platforms.toString()}`);

  return chain([
    prerun(options, true),
    // update gitignore to support xplat
    updateGitIgnore(),
    // add references to support xplat
    addReferences(),
    // libs
    (tree: Tree, context: SchematicContext) =>
      addLibFiles(tree, options)(tree, context),
    // nativescript
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.nativescript
        ? addPlatformFiles(tree, options, 'nativescript')(tree, context)
        : noop()(tree, context),
    // web
    (tree: Tree, context: SchematicContext) =>
      // always generate web if ionic or electron is specified since they depend on it
      hasWebPlatform(targetPlatforms)
        ? addPlatformFiles(tree, options, 'web')(tree, context)
        : noop()(tree, context),
    // ionic
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.ionic
        ? addPlatformFiles(tree, options, 'ionic')(tree, context)
        : noop()(tree, context),
    // electron
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.electron
        ? addPlatformFiles(tree, options, 'electron')(tree, context)
        : noop()(tree, context),
    // testing
    // TODO: call external schematic for workspace xplat to add testing
    // (tree: Tree, context: SchematicContext) =>
    //   addTestingFiles(tree, options)(tree, context),
    updateTestingConfig,
    updateLint,
    // update tsconfig files to support xplat
    (tree: Tree, context: SchematicContext) =>
      schematic('ts-config', {
        platforms: platformArg
      })(tree, context),
    formatFiles(options),
    // update root package for xplat configuration
    (tree: Tree) => updatePackageForXplat(tree, targetPlatforms),
    // clean shared code script ({N} build artifacts that may need to be cleaned up at times)
    (tree: Tree) => {
      const scripts = {};
      scripts[
        `clean.shared`
      ] = `cd libs/ && git clean -dfX && cd ../xplat/ && git clean -dfX`;
      return updatePackageScripts(tree, scripts);
    },
    // update IDE settings
    (tree: Tree) => updateIDESettings(tree, platformArg)
  ]);
}
