import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import {
  prerun,
} from '@nstudio/xplat-utils';
import { XplatHelpers } from '../../utils';

export default function(options: XplatHelpers.NgAddSchema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/xplat', 'init', options)
  ]);
}
