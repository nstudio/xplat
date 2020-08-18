import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop,
} from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';

export default function (options: XplatHelpers.NgAddSchema) {
  return chain([
    prerun(options, true),
    options.platforms
      ? (tree: Tree, context: SchematicContext) =>
          externalSchematic('@nstudio/nativescript', 'xplat', options)
      : noop(),
  ]);
}
