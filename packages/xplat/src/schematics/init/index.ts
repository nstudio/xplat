import {
  chain,
  Tree,
  SchematicContext,
  externalSchematic,
  SchematicsException,
  noop
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
  unsupportedFrameworkError,
  errorMissingPrefix,
  addInstallTask,
  isTesting,
  getJsonFromFile,
  packageInnerDependencies,
  IXplatSettings
} from '../../utils';
import {
  NodePackageInstallTask,
  RunSchematicTask
} from '@angular-devkit/schematics/tasks';
import { xplatVersion, nrwlVersion } from '../../utils/versions';

let packagesToRunXplat: Array<string> = [];
export default function(options: XplatHelpers.Schema) {
  if (!options.prefix) {
    throw new SchematicsException(errorMissingPrefix);
  }

  const externalChains = [];
  const platformArg = options.platforms || '';

  // frontend framework
  const frameworks = XplatHelpers.getFrameworksFromOptions(options.framework);
  const frameworkChoice = XplatHelpers.getFrameworkChoice(
    options.framework,
    frameworks
  );

  const devDependencies = {};
  if (platformArg === 'all') {
    // requested by Mike Brocchi on AngularAir long ago :)
    // conveniently add support for all supported platforms
    options.platforms = supportedPlatforms.join(',');
    if (frameworks.length) {
      // when using a framework, each integration has it's own xplat handler to invoke the differnet platforms so always enter through the framework
      for (const framework of frameworks) {
        if (supportedFrameworks.includes(framework)) {
          const packageName = `@nstudio/${framework}`;
          devDependencies[packageName] = xplatVersion;
          // framework initiates xplat for all integrations
          packagesToRunXplat.push(packageName);
          // when framework initiates xplat, ensure any platform packages are installed
          for (const platform of supportedPlatforms) {
            devDependencies[`@nstudio/${platform}-${framework}`] = xplatVersion;
          }
        } else {
          throw new SchematicsException(unsupportedFrameworkError(framework));
        }
      }
    } else {
      for (const platform of supportedPlatforms) {
        const packageName = `@nstudio/${platform}`;
        devDependencies[packageName] = xplatVersion;
        packagesToRunXplat.push(packageName);
      }
    }
  } else {
    const platforms = <Array<PlatformTypes>>(
      (<unknown>sanitizeCommaDelimitedArg(platformArg))
    );
    if (frameworks.length) {
      for (const framework of frameworks) {
        if (supportedFrameworks.includes(framework)) {
          const packageName = `@nstudio/${framework}`;
          devDependencies[packageName] = xplatVersion;
          // framework initiates xplat for all integrations
          packagesToRunXplat.push(packageName);
          // when framework initiates xplat, ensure any platform packages are installed
          for (const platform of platforms) {
            devDependencies[`@nstudio/${platform}-${framework}`] = xplatVersion;
          }
        } else {
          throw new SchematicsException(unsupportedFrameworkError(framework));
        }
      }
    } else if (platforms.length) {
      for (const platform of platforms) {
        if (supportedPlatforms.includes(platform)) {
          const packageName = `@nstudio/${platform}`;
          devDependencies[`@nstudio/${platform}`] = xplatVersion;
          packagesToRunXplat.push(packageName);
        } else {
          throw new SchematicsException(unsupportedPlatformError(platform));
        }
      }
    }
  }

  externalChains.push((tree: Tree, context: SchematicContext) => {
    // check if other nstudio or nrwl dependencies are needed
    // check user's package for current version
    const packageJson = getJsonFromFile(tree, 'package.json');
    if (packageJson) {
      for (const packageName in devDependencies) {
        if (packageInnerDependencies[packageName]) {
          // inner dependencies are either nstudio or nrwl based packages
          let version =
            packageName.indexOf('nstudio') > -1 ? xplatVersion : nrwlVersion;
          // ensure inner schematic dependencies are installed
          for (const name of packageInnerDependencies[packageName]) {
            // always use existing versions if user already has them installed
            if (packageJson.dependencies && packageJson.dependencies[name]) {
              version = packageJson.dependencies[name];
            } else if (
              packageJson.devDependencies &&
              packageJson.devDependencies[name]
            ) {
              version = packageJson.devDependencies[name];
            }
            devDependencies[name] = version;
          }
        }
      }
    }
    // console.log(devDependencies);

    const xplatSettings: IXplatSettings = {};
    if (frameworkChoice && options.setDefault) {
      xplatSettings.defaultFramework = frameworkChoice;
    }
    // console.log('options.setDefault:', options.setDefault);
    // console.log('xplatSettings:', xplatSettings);
    return XplatHelpers.updatePackageForXplat(
      options,
      {
        devDependencies
      },
      xplatSettings
    )(tree, context);
  });

  if (options.isTesting) {
    // necessary to unit test the appropriately
    if (packagesToRunXplat.length) {
      for (const packageName of packagesToRunXplat) {
        externalChains.push(
          externalSchematic(packageName, 'xplat', options, {
            interactive: false
          })
        );
      }
    }
  } else {
    // TODO: find a way to unit test schematictask runners with install tasks
    externalChains.push((tree: Tree, context: SchematicContext) => {
      const deps = Object.keys(devDependencies);
      if (deps.length) {
        const installPackageTask = context.addTask(
          new NodePackageInstallTask()
        );

        // console.log('packagesToRunXplat:', packagesToRunXplat);
        for (const packageName in devDependencies) {
          if (
            packageName.indexOf('@nstudio') > -1 &&
            packagesToRunXplat.includes(packageName)
          ) {
            context.addTask(
              new RunSchematicTask(packageName, 'xplat', options),
              [installPackageTask]
            );
          }
        }
      } else {
        return noop()(tree, context);
      }
    });
  }

  if (Object.keys(devDependencies).length) {
    // if processing dependencies, ensure IDE settings are updated to hide hidden folders used to help xplat configure workspaces
    externalChains.push(XplatHelpers.updateIDESettings(options));
  }

  return chain([
    prerun(options, true),
    ...externalChains,
    addInstallTask(options)
  ]);
}
