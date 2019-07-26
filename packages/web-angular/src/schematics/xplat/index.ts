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
  move
} from '@angular-devkit/schematics';
import {
  XplatHelpers,
  prerun,
  getDefaultTemplateOptions
} from '@nstudio/xplat';
import { XplatWebAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      // console.log('xplatName:', xplatName);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(options, xplatFolderName)(
            tree,
            context
          );
    },
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      if (tree.exists(`/xplat/${xplatFolderName}/scss/_index.scss`)) {
        // may have already generated vanilla web support
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_scss_files`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions()
              }),
              move(`xplat/${xplatFolderName}/scss`)
            ])
          )
        )(tree, context);
      }
    },
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('/libs/scss/_index.scss')) {
        // user may have generated support already
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_lib_files`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions()
              }),
              move('libs')
            ])
          )
        )(tree, context);
      }
    },
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatWebAngularHelpers.updateRootDeps(options)
  ]);
}
