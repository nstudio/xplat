import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';

export default function(options: XplatHelpers.NgAddSchema) {
  return chain([
    prerun(options, true),
    options.platforms
      ? (tree: Tree, context: SchematicContext) =>
          externalSchematic('@nstudio/web-angular', 'xplat', options)
      : noop()
  ]);
}
