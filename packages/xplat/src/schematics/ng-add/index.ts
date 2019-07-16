import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '../../utils';

export default function(options: XplatHelpers.NgAddSchema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/xplat', 'init', options)
  ]);
}
