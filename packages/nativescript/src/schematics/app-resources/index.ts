import {
  apply,
  // branchAndMerge,
  chain,
  move,
  template,
  url,
  mergeWith
} from '@angular-devkit/schematics';
import { getDefaultTemplateOptions } from '@nstudio/workspace';

import { Schema as AppResourcesSchema } from './schema';

export default function(options: AppResourcesSchema) {
  return chain([
    mergeWith(
      apply(url('./_files'), [
        template({
          ...getDefaultTemplateOptions(),
          name: options.name
        }),
        move(options.path)
      ])
    )
  ]);
}
