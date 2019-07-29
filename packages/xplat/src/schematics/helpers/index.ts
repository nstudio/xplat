import {
  chain,
  SchematicsException,
  externalSchematic
} from '@angular-devkit/schematics';
import {
  prerun,
  PlatformTypes,
  supportedPlatforms,
  unsupportedPlatformError,
  helperMissingPlatforms,
  missingArgument
} from '@nstudio/xplat';
import { Schema } from './schema';
import { sanitizeCommaDelimitedArg } from '../../utils';

const platformToPackage: { [platform: string]: string } = {
  nativescript: '@nstudio/nativescript',
  web: '@nstudio/angular'
};

export default function(options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        `Provide a comma delimited list of helpers to generate like this for 'applitools'.`,
        'nx g @nstudio/xplat:helpers applitools --target=web-myapp'
      )
    );
  }
  const platforms = <Array<PlatformTypes>>(
    sanitizeCommaDelimitedArg(options.platforms)
  );

  const helperChains = [];

  const processHelpers = (platform?: PlatformTypes) => {
    // get helper support config
    if (!platform) {
      // when using targeting the platforms argument can be ommitted
      // however when doing so it relies on platform being in the target name
      if (options.target) {
        for (const p of supportedPlatforms) {
          const match = options.target.match(p);
          if (match) {
            platform = <PlatformTypes>match[0];
            break;
          }
        }
      }
    }
    // if platform is still falsey, error out
    if (!platform) {
      throw new SchematicsException(helperMissingPlatforms());
    }

    helperChains.push(
      externalSchematic(platformToPackage[platform], 'helpers', {
        name: options.name,
        target: options.target
      })
    );
  };

  if (platforms.length) {
    for (const platform of platforms) {
      if (supportedPlatforms.includes(platform)) {
        processHelpers(platform);
      } else {
        throw new SchematicsException(unsupportedPlatformError(platform));
      }
    }
  } else {
    processHelpers();
  }

  return chain([
    prerun(),
    // add helper chains
    ...helperChains
  ]);
}
