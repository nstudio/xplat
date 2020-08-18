import {
  IHelperSchema,
  buildHelperChain,
  unsupportedHelperError,
  missingArgument
} from '@nstudio/xplat';
import {
  prerun,
} from '@nstudio/xplat-utils';
import { SchematicsException, chain, noop } from '@angular-devkit/schematics';
import { config as configImports } from './imports';

const supportedHelpers = {
  imports: configImports
};

export default function(options: IHelperSchema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide the name of the helper to generate.',
        'nx g @nstudio/nativescript:helpers imports'
      )
    );
  }

  const helperChain = [];
  const helpers = options.name.split(',');

  for (const helper of helpers) {
    if (supportedHelpers[helper]) {
      buildHelperChain(helper, options, supportedHelpers[helper], helperChain);
    } else {
      helperChain.push(noop());
    }
  }

  return chain([prerun(), ...helperChain]);
}
