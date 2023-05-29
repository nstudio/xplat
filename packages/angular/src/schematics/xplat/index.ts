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
import { addInstallTask, formatFiles } from '@nx/workspace';
import {
  XplatHelpers,
  convertNgTreeToDevKit,
  getDefaultTemplateOptions,
  updateTsConfig,
} from '@nstudio/xplat';
import { prerun, getNpmScope } from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '../../utils/xplat';
import { FocusHelpers } from '@nstudio/focus';
import { convertNxGenerator } from '@nx/devkit';
import { initGenerator } from '@nx/js';

export default function (options: XplatHelpers.Schema) {
  // console.log(`Generating xplat angular support for: ${options.platforms}`);
  const externalChains = XplatAngularHelpers.externalChains(options);

  return chain([
    prerun(options, true),
    // async (tree, context) => {
    //   const nxTree = convertNgTreeToDevKit(tree, context);
    //   await initGenerator(nxTree, { skipFormat: true });
    //   console.log('here!!')
    // },
    (tree, context) => {
      console.log('here!!')
      return noop()(tree,context);
    },
    // libs
    XplatHelpers.generateLib(options, 'core', 'xplat', 'node'),
    XplatHelpers.cleanupLib(options, 'core', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'core'),
    XplatHelpers.generateLib(options, 'features', 'xplat', 'node'),
    XplatHelpers.cleanupLib(options, 'features', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'features'),
    XplatHelpers.generateLib(options, 'scss', 'xplat', 'jsdom'),
    XplatHelpers.cleanupLib(options, 'scss', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'scss'),
    XplatHelpers.generateLib(options, 'utils', 'xplat', 'node'),
    XplatHelpers.cleanupLib(options, 'utils', 'xplat'),
    XplatAngularHelpers.addLibFiles(options, './', 'utils'),
    // cross platform support
    (tree: Tree, context: SchematicContext) => chain(externalChains),
    XplatAngularHelpers.updateRootDeps(options),
    // adjust root tsconfig
    (tree: Tree, context: SchematicContext) => {
      return updateTsConfig(tree, (tsConfig: any) => {
        if (tsConfig) {
          if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
          }
          if (
            !tsConfig.compilerOptions.paths[
              `@${getNpmScope()}/xplat/environments`
            ]
          ) {
            tsConfig.compilerOptions.paths[
              `@${getNpmScope()}/xplat/environments`
            ] = [`libs/xplat/core/src/lib/environments/base/index.ts`];
          }
        }
      });
    },
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
    // addInstallTask(),
  ]);
}
