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
  template
} from '@angular-devkit/schematics';
import {
  XplatHelpers,
  prerun,
  getDefaultTemplateOptions
} from '@nstudio/xplat';
import { XplatWebHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('libs/scss')) {
        return noop();
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_lib_files`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions()
              }),
              move(`libs`)
            ])
          )
        );
      }
    },
    XplatHelpers.addPlatformFiles(options, 'web'),
    XplatHelpers.updateTsConfigPaths(options),
    XplatWebHelpers.updateRootDeps(options)
  ]);
}
