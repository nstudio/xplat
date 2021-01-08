import {
  chain,
  externalSchematic,
  branchAndMerge,
  SchematicContext,
  Tree,
  noop,
  mergeWith,
  apply,
  url,
  move,
  template,
} from '@angular-devkit/schematics';
import { XplatHelpers, getDefaultTemplateOptions } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatWebHelpers } from '../../utils/xplat';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('/libs/xplat/scss/src/_index.scss')) {
        // may have already generated support
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_files_lib_scss`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions(),
              }),
              move(`libs/xplat/scss/src`),
            ])
          )
        )(tree, context);
      }
    },
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('/libs/xplat/web/scss/src/_index.scss')) {
        // may have already generated support
        return noop()(tree, context);
      } else {
        return XplatHelpers.addPlatformFiles(
          options,
          'web',
          'scss',
          '_index.scss'
        )(tree, context);
      }
    },
    XplatWebHelpers.updateRootDeps(options),
  ]);
}
