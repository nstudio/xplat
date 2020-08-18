import {
  chain,
  noop,
  Tree,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  move,
  template,
  SchematicContext
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import {
  XplatHelpers,
  getDefaultTemplateOptions
} from '@nstudio/xplat';
import {
  prerun,
  addInstallTask
 } from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '../../utils/xplat';
import { FocusHelpers } from '@nstudio/focus';

export default function(options: XplatHelpers.Schema) {
  // console.log(`Generating xplat angular support for: ${options.platforms}`);
  const externalChains = XplatAngularHelpers.externalChains(options);

  return chain([
    prerun(options, true),
    // update gitignore to support xplat
    XplatHelpers.updateGitIgnore(),
    // libs
    XplatAngularHelpers.addLibFiles(options),
    XplatAngularHelpers.addScssFiles(options),
    // cross platform support
    ...externalChains,
    // testing
    XplatAngularHelpers.addTestingFiles(options, '_testing'),
    XplatAngularHelpers.addJestConfig(options, '_jest'),
    XplatAngularHelpers.updateTestingConfig(options),
    XplatAngularHelpers.updateLint(options),
    XplatAngularHelpers.updateRootDeps(options),
    formatFiles({ skipFormat: options.skipFormat }),
    // clean shared code script - don't believe need this anymore
    // (tree: Tree) => {
    //   const scripts = {};
    //   scripts[
    //     `clean.shared`
    //   ] = `cd libs/ && git clean -dfX && cd ../xplat/ && git clean -dfX`;
    //   return updatePackageScripts(tree, scripts);
    // },
    // update IDE settings
    FocusHelpers.updateIDESettings(options),
    addInstallTask(options)
  ]);
}
