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
      if (tree.exists('/libs/scss/_index.scss')) {
        // may have already generated support
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_lib_files`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions(),
              }),
              move(`libs`),
            ])
          )
        )(tree, context);
      }
    },
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('/xplat/web/scss/_index.scss')) {
        // may have already generated support
        return noop()(tree, context);
      } else {
        return XplatHelpers.addPlatformFiles(options, 'web')(tree, context);
      }
    },
    XplatHelpers.updateTsConfigPaths(options),
    XplatWebHelpers.updateRootDeps(options),
  ]);
}
