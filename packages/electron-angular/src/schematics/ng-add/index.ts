import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { prerun, XplatHelpers } from '@nstudio/xplat';

export default function(options: XplatHelpers.NgAddSchema) {
  return chain([
    prerun(options, true),
    options.platforms
      ? (tree: Tree, context: SchematicContext) =>
          externalSchematic('@nstudio/electron-angular', 'xplat', options)
      : noop()
  ]);
}
