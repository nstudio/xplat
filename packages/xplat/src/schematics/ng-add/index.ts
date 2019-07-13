import {
  chain,
  SchematicsException,
  externalSchematic,
  Tree,
  SchematicContext
} from '@angular-devkit/schematics';
import { prerun, errorMissingPrefix } from '@nstudio/xplat';
import { Schema as ApplicationOptions } from './schema';

export default function(options: ApplicationOptions) {
  if (!options.prefix) {
    throw new SchematicsException(errorMissingPrefix);
  }

  return chain([
    prerun(options, true),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/xplat', 'xplat', options)
  ]);
}
