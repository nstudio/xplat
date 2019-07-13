import {
  chain,
  Tree,
  SchematicContext,
  externalSchematic,
  SchematicsException
} from '@angular-devkit/schematics';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  supportedPlatforms,
  prerun,
  unsupportedPlatformError,
  noPlatformError,
  sanitizeCommaDelimitedArg
} from '@nstudio/xplat';
import {
  PlatformTypes,
  FrameworkTypes,
  supportedFrameworks,
  XplatHelpers,
  unsupportedFrameworkError
} from '../../utils';

export default function(options: XplatHelpers.Schema) {
  const externalChains = [];
  const platformArg = options.platforms || '';
  // frontend framework
  const frameworkArg = options.framework || '';
  const frameworks = <Array<FrameworkTypes>>(
    (<unknown>(
      (frameworkArg === 'all'
        ? supportedFrameworks
        : sanitizeCommaDelimitedArg(frameworkArg))
    ))
  );

  if (platformArg === 'all') {
    // conveniently add support for all supported platforms
    if (frameworks.length) {
      // when using a framework, each integration has it's own xplat handler to invoke the differnet platforms so always enter through the framework
      for (const framework of frameworks) {
        if (supportedFrameworks.includes(framework)) {
          // console.log('addchainforplatform:', `@nstudio/${framework}`);
          options.platforms = supportedPlatforms.join(',');
          externalChains.push(
            externalSchematic(`@nstudio/${framework}`, 'xplat', options, {
              interactive: false
            })
          );
        } else {
          throw new SchematicsException(unsupportedFrameworkError(framework));
        }
      }
    } else {
      for (const platform of supportedPlatforms) {
        externalChains.push(
          externalSchematic(`@nstudio/${platform}`, 'xplat', options, {
            interactive: false
          })
        );
      }
    }
  } else {
    const platforms = <Array<PlatformTypes>>(
      (<unknown>sanitizeCommaDelimitedArg(platformArg))
    );
    if (platforms.length === 0) {
      throw new SchematicsException(noPlatformError());
    } else if (frameworks.length) {
      for (const framework of frameworks) {
        if (supportedFrameworks.includes(framework)) {
          externalChains.push(
            externalSchematic(`@nstudio/${framework}`, 'xplat', options, {
              interactive: false
            })
          );
        } else {
          throw new SchematicsException(unsupportedFrameworkError(framework));
        }
      }
    } else {
      for (const platform of platforms) {
        if (supportedPlatforms.includes(platform)) {
          externalChains.push(
            externalSchematic(`@nstudio/${platform}`, 'xplat', options, {
              interactive: false
            })
          );
        } else {
          throw new SchematicsException(unsupportedPlatformError(platform));
        }
      }
    }
  }

  return chain([prerun(options, true), ...externalChains]);
}
