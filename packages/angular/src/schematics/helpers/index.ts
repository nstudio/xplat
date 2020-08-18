import {
  IHelperSchema,
  buildHelperChain,
  missingArgument,
} from '@nstudio/xplat';
import { prerun, addInstallTask } from '@nstudio/xplat-utils';
import { config as configApplitools } from './applitools';
import { SchematicsException, chain, noop } from '@angular-devkit/schematics';

const supportedHelpers = {
  applitools: configApplitools,
};

export default function (options: IHelperSchema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide the name of the helper to generate.',
        'nx g @nstudio/angular:helpers applitools --target=web-myapp'
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

  return chain([prerun(<any>options), ...helperChain, addInstallTask(options)]);
}
