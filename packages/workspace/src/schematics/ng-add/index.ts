import {
  chain,
  SchematicsException,
  externalSchematic
} from '@angular-devkit/schematics';
import { prerun, errorMissingPrefix } from '@nstudio/workspace';
import { Schema as ApplicationOptions } from './schema';

export default function(options: ApplicationOptions) {
  if (!options.prefix) {
    throw new SchematicsException(errorMissingPrefix);
  }

  return chain([
    prerun(options, true),
    externalSchematic('@nstudio/workspace', 'xplat', options)
  ]);
}
