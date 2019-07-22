import { Schema } from './schema';
import {
  chain,
  externalSchematic,
  SchematicsException,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import {
  prerun,
  XplatHelpers,
  PlatformTypes,
  sanitizeCommaDelimitedArg,
  supportedFrameworks,
  unsupportedFrameworkError,
  supportedPlatforms,
  unsupportedPlatformError,
  getJsonFromFile,
  packageInnerDependencies,
  IXplatSettings
} from '../../utils';
import { xplatVersion, nrwlVersion } from '../../utils/versions';
import {
  NodePackageInstallTask,
  RunSchematicTask
} from '@angular-devkit/schematics/tasks';

let packagesToRunXplat: Array<string> = [];
export default function(options: Schema) {
  const externalChains = [];
  const devDependencies = {};

  // frontend framework
  const frameworks = XplatHelpers.getFrameworksFromOptions(options.framework);
  const frameworkChoice = XplatHelpers.getFrameworkChoice(
    options.framework,
    frameworks
  );
  // console.log('frameworks:', frameworks);
  // console.log('frameworkChoice:', frameworkChoice);

  const platforms = <Array<PlatformTypes>>(
    (<unknown>sanitizeCommaDelimitedArg(options.platforms))
  );
  // console.log('platforms:', platforms);
  if (frameworks.length) {
    for (const framework of frameworks) {
      if (supportedFrameworks.includes(framework)) {
        if (platforms.length) {
          for (const platform of platforms) {
            if (platform === 'web' && framework === 'angular') {
              // TODO: move angular app into web-angular package
              // right now it lives in angular package
              const packageName = `@nstudio/${framework}`;
              devDependencies[packageName] = xplatVersion;
              // externalChains.push(externalSchematic(`@nstudio/${framework}`, 'app', options));
              packagesToRunXplat.push(packageName);
            } else {
              const packageName = `@nstudio/${platform}-${framework}`;
              devDependencies[packageName] = xplatVersion;
              // externalChains.push(externalSchematic(`@nstudio/${platform}-${framework}`, 'app', options));
              packagesToRunXplat.push(packageName);
            }
          }
        }
      } else {
        throw new SchematicsException(unsupportedFrameworkError(framework));
      }
    }
  } else if (platforms.length) {
    for (const platform of platforms) {
      if (supportedPlatforms.includes(platform)) {
        const packageName = `@nstudio/${platform}`;
        devDependencies[packageName] = xplatVersion;
        // externalChains.push(externalSchematic(packageName, 'app', options));
        packagesToRunXplat.push(packageName);
      } else {
        throw new SchematicsException(unsupportedPlatformError(platform));
      }
    }
  }

  if (Object.keys(devDependencies).length) {
    externalChains.push((tree: Tree, context: SchematicContext) => {
      // check if othet nstudio or nrwl dependencies are needed
      // check user's package for current version
      const packageJson = getJsonFromFile(tree, 'package.json');
      if (packageJson) {
        for (const packageName in devDependencies) {
          if (packageInnerDependencies[packageName]) {
            // inner dependencies are either nstudio or nrwl based packages
            let version: string;
            // ensure inner schematic dependencies are installed
            for (const name of packageInnerDependencies[packageName]) {
              if (name.indexOf('nrwl') > -1) {
                // default to internally managed/supported nrwl version
                version = nrwlVersion;
                // look for existing nrwl versions if user already has them installed and use those
                if (
                  packageJson.dependencies &&
                  packageJson.dependencies[name]
                ) {
                  version = packageJson.dependencies[name];
                } else if (
                  packageJson.devDependencies &&
                  packageJson.devDependencies[name]
                ) {
                  version = packageJson.devDependencies[name];
                }
                devDependencies[name] = version;
              } else {
                devDependencies[name] = xplatVersion;
              }
            }
          }
        }
      }
      // console.log(devDependencies);

      return XplatHelpers.updatePackageForXplat(options, {
        devDependencies
      })(tree, context);
    });

    if (options.isTesting) {
      // necessary to unit test the appropriately
      if (packagesToRunXplat.length) {
        for (const packageName of packagesToRunXplat) {
          externalChains.push(
            externalSchematic(packageName, 'app', options, {
              interactive: false
            })
          );
        }
      }
    } else {
      externalChains.push((tree: Tree, context: SchematicContext) => {
        const installPackageTask = context.addTask(
          new NodePackageInstallTask()
        );

        // console.log('devDependencies:', devDependencies);
        // console.log('packagesToRunXplat:', packagesToRunXplat);
        for (const packageName of packagesToRunXplat) {
          context.addTask(new RunSchematicTask(packageName, 'app', options), [
            installPackageTask
          ]);
        }
      });
    }
  }

  return chain([prerun(options, true), ...externalChains]);
}
