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
  SchematicContext,
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import { XplatHelpers, getDefaultTemplateOptions } from '@nstudio/xplat';
import { prerun, addInstallTask } from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '../../utils/xplat';
import { FocusHelpers } from '@nstudio/focus';

export default function (options: XplatHelpers.Schema) {
  // console.log(`Generating xplat angular support for: ${options.platforms}`);
  const externalChains = XplatAngularHelpers.externalChains(options);

  return chain([
    prerun(options, true),
    // libs
    XplatAngularHelpers.generateLib(options, 'core', 'xplat', 'node'),
    XplatAngularHelpers.cleanupLib(options, 'core', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'core'),
    XplatAngularHelpers.generateLib(options, 'features', 'xplat', 'node'),
    XplatAngularHelpers.cleanupLib(options, 'features', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'features'),
    XplatAngularHelpers.generateLib(options, 'scss', 'xplat', 'jsdom'),
    XplatAngularHelpers.cleanupLib(options, 'scss', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'scss'),
    XplatAngularHelpers.generateLib(options, 'utils', 'xplat', 'node'),
    XplatAngularHelpers.cleanupLib(options, 'utils', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'utils'),
    // cross platform support
    ...externalChains,
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
    addInstallTask(options),
  ]);
}
