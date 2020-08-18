import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { Schema } from './schema';
import { prerun } from '@nstudio/xplat-utils';

export default function(options: Schema) {
  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/focus', 'mode', options)
  ]);
}
