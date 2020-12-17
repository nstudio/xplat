import {
  chain,
  externalSchematic,
  noop,
  Tree,
  SchematicContext,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
} from '@angular-devkit/schematics';
import { XplatAngularHelpers } from '@nstudio/angular';
import { XplatHelpers, getDefaultTemplateOptions } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatWebAngularHelpers } from '../../utils/xplat';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    XplatAngularHelpers.generateLib(options, 'core', 'xplat/web', 'jsdom'),
    XplatAngularHelpers.cleanupLib(options, 'core', 'xplat/web'),
    XplatAngularHelpers.generateLib(options, 'features', 'xplat/web', 'jsdom'),
    XplatAngularHelpers.cleanupLib(options, 'features', 'xplat/web'),
    XplatAngularHelpers.generateLib(options, 'scss', 'xplat/web', 'jsdom'),
    XplatAngularHelpers.cleanupLib(options, 'scss', 'xplat/web'),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(
            options,
            xplatFolderName,
            'core'
          )(tree, context);
    },
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(
            options,
            xplatFolderName,
            'features'
          )(tree, context);
    },
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      if (tree.exists(`/libs/xplat/${xplatFolderName}/scss/src/_index.scss`)) {
        // may have already generated web support
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_files_platform_scss`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions(),
              }),
              move(`libs/xplat/${xplatFolderName}/scss/src`),
            ])
          )
        )(tree, context);
      }
    },
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('/libs/xplat/scss/src/_index.scss')) {
        // user may have generated support already
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_files_lib_scss`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions(),
              }),
              move('libs/xplat/scss/src'),
            ])
          )
        )(tree, context);
      }
    },
    XplatWebAngularHelpers.updateRootDeps(options),
  ]);
}
