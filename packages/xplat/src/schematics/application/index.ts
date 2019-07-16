import { Schema } from './schema';
import {
  chain,
  externalSchematic,
  SchematicsException
} from '@angular-devkit/schematics';
import {
  prerun,
  XplatHelpers,
  PlatformTypes,
  sanitizeCommaDelimitedArg,
  supportedFrameworks,
  unsupportedFrameworkError,
  supportedPlatforms,
  unsupportedPlatformError
} from '../../utils';

export default function(options: Schema) {
  const externalChains = [];

  // frontend framework
  const frameworks = XplatHelpers.getFrameworksFromOptions(options.framework);
  const frameworkChoice = XplatHelpers.getFrameworkChoice(
    options.framework,
    frameworks
  );

  const platforms = <Array<PlatformTypes>>(
    (<unknown>sanitizeCommaDelimitedArg(options.platforms))
  );
  if (frameworks.length) {
    for (const framework of frameworks) {
      if (supportedFrameworks.includes(framework)) {
        const packageName = `@nstudio/${framework}`;
        externalChains.push(externalSchematic(packageName, 'app', options));
      } else {
        throw new SchematicsException(unsupportedFrameworkError(framework));
      }
    }
  } else if (platforms.length) {
    for (const platform of platforms) {
      if (supportedPlatforms.includes(platform)) {
        const packageName = `@nstudio/${platform}`;
        externalChains.push(externalSchematic(packageName, 'app', options));
      } else {
        throw new SchematicsException(unsupportedPlatformError(platform));
      }
    }
  }

  return chain([prerun(options, true), ...externalChains]);
}
