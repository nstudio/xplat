import {
  chain,
  SchematicsException,
  externalSchematic,
} from "@angular-devkit/schematics";
import { prerun, errorMissingPrefix } from '../utils';
import { Schema as ApplicationOptions } from "./schema";

export default function(options: ApplicationOptions) {
  if (!options.prefix) {
    throw new SchematicsException(errorMissingPrefix);
  }

  return chain([
    prerun(options, true),
    externalSchematic("@nstudio/schematics", "xplat", options),
  ]);
}
