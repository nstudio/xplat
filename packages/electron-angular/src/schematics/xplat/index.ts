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
  addPlatformFiles,
  addLibFiles,
  updateTestingConfig,
  updateLint
} from '@nstudio/workspace';
import { getDefaultTemplateOptions, IXplatSchema } from '@nstudio/workspace';

export default function(options: IXplatSchema) {
  return chain([
    prerun(options, true),
    // update gitignore to support xplat
    updateGitIgnore(),
    // add references to support xplat
    addReferences(),

    (tree: Tree, context: SchematicContext) =>
      addPlatformFiles(tree, options, 'electron')(tree, context),
    // testing
    (tree: Tree, context: SchematicContext) =>
      addTestingFiles(tree, options)(tree, context),
    updateTestingConfig,
    updateLint,
    // update tsconfig files to support xplat
    (tree: Tree, context: SchematicContext) =>
      schematic('ts-config', {
        platforms: 'electron'
      })(tree, context),
    formatFiles(options),
    // update root package for xplat configuration
    (tree: Tree) => updatePackageForXplat(tree, { web: true }),
    // clean shared code script ({N} build artifacts that may need to be cleaned up at times)
    (tree: Tree) => {
      const scripts = {};
      scripts[
        `clean.shared`
      ] = `cd libs/ && git clean -dfX && cd ../xplat/ && git clean -dfX`;
      return updatePackageScripts(tree, scripts);
    },
    // update IDE settings
    (tree: Tree) => updateIDESettings(tree, 'electron')
  ]);
}
