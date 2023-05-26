import {
  apply,
  chain,
  Tree,
  Rule,
  url,
  move,
  template,
  mergeWith,
  branchAndMerge,
  SchematicContext,
  SchematicsException,
  schematic,
  noop,
  externalSchematic,
} from '@angular-devkit/schematics';
import {
  updatePackageScripts,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
  updateTsConfig,
  output,
} from '@nstudio/xplat';
import {
  prerun,
  getPrefix,
  getAppName,
  getJsonFromFile,
  updateJsonFile,
} from '@nstudio/xplat-utils';
import { Schema } from './schema';
import { XplatNativeScriptAngularHelpers } from '../../utils';
import {
  nsCoreVersion,
  angularVersion,
  nsNgScopedVersion,
  nsNgFonticonVersion,
  ngxTranslateVersion,
  nsThemeCoreVersion,
  rxjsVersion,
  zonejsVersion,
  nsWebpackVersion,
  typescriptVersion,
} from '../../utils/versions';
import { XplatNativeScriptHelpers } from '@nstudio/nativescript/src/utils';
import { addInstallTask, updateWorkspace } from '@nx/workspace';

export default function (options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your NativeScript app.',
        'nx g @nstudio/nativescript-angular:app name'
      )
    );
  }
  if (options.setupSandbox) {
    // always setup routing with sandbox
    options.routing = true;
  }

  return chain([
    prerun(options),
    // adjust naming convention
    XplatHelpers.applyAppNamingConvention(options, 'nativescript'),
    // use xplat or not
    options.useXplat
      ? externalSchematic('@nstudio/nativescript-angular', 'xplat', options)
      : noop(),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name, options.useXplat ? '' : 'skipxplat'),
    // add features
    (tree: Tree, context: SchematicContext) =>
      options.routing && options.useXplat
        ? addAppFiles(options, options.name, 'routing')(tree, context)
        : noop()(tree, context),
    // add app resources
    (tree: Tree, context: SchematicContext) => {
      // inside closure to ensure it uses the modifed options.name from applyAppNamingConvention
      const directory = options.directory ? `${options.directory}/` : '';
      return externalSchematic(
        '@nstudio/nativescript',
        'app-resources',
        {
          path: `apps/${directory}${options.name}`,
        },
        { interactive: false }
      )(tree, context);
    },
    // add root package dependencies
    XplatNativeScriptAngularHelpers.updateRootDeps(options),
    XplatNativeScriptHelpers.updatePrettierIgnore(),
    // addInstallTask(),
    addNsCli(options.addCliDependency),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      scripts[
        `clean`
      ] = `npx rimraf hooks node_modules package-lock.json yarn.lock && yarn`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree, context: SchematicContext) => {
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      return updateWorkspace((workspace) => {
        workspace.projects.add({
          name: `${options.name}`,
          root: `apps/${directory}${options.name}/`,
          sourceRoot: `apps/${directory}${options.name}/src`,
          projectType: 'application',
          prefix: getPrefix(),
          targets: {
            build: {
              builder: '@nativescript/nx:build',
              options: {
                noHmr: true,
                production: true,
                uglify: true,
                release: true,
                forDevice: true,
              },
              configurations: {
                prod: {
                  fileReplacements: [
                    {
                      replace: `${
                        directory ? '../../../' : '../../'
                      }libs/xplat/core/src/lib/environments/environment.ts`,
                      with: `./src/environments/environment.prod.ts`,
                    },
                  ],
                },
              },
            },
            ios: {
              builder: '@nativescript/nx:build',
              options: {
                platform: 'ios',
              },
              configurations: {
                build: {
                  copyTo: './dist/build.ipa',
                },
                prod: {
                  combineWithConfig: 'build:prod',
                },
              },
            },
            android: {
              builder: '@nativescript/nx:build',
              options: {
                platform: 'android',
              },
              configurations: {
                build: {
                  copyTo: './dist/build.apk',
                },
                prod: {
                  combineWithConfig: 'build:prod',
                },
              },
            },
            clean: {
              builder: '@nativescript/nx:build',
              options: {
                clean: true,
              },
            },
            lint: {
              builder: '@nx/linter:eslint',
              options: {
                lintFilePatterns: [
                  `apps/${directory}${options.name}/**/*.ts`,
                  `apps/${directory}${options.name}/src/**/*.html`,
                ],
              },
            },
            test: {
              builder: '@nx/jest:jest',
              options: {
                jestConfig: `apps/${directory}${options.name}/jest.config.js`,
                tsConfig: `apps/${directory}${options.name}/tsconfig.spec.json`,
                passWithNoTests: true,
                setupFile: `apps/${directory}${options.name}/src/test-setup.ts`,
              },
            },
          },
        });
      });
    },
    (tree: Tree) => {
      output.log({
        title: 'You will be able to run your app with:',
        bodyLines: [
          `nx run ${options.name}:ios`,
          `   `,
          `nx run ${options.name}:android`,
          `   `,
          `You can also:`,
          `   `,
          `nx run ${options.name}:clean`,
        ],
      });
    },
  ]);
}

function addAppFiles(
  options: Schema,
  appPath: string,
  extra: string = ''
): Rule {
  extra = extra ? `${extra}_` : '';
  const appname = getAppName(options, 'nativescript');
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          appname,
          directoryAppPath: `${directory}${appPath}`,
          pathOffset: directory ? '../../../' : '../../',
          angularVersion: angularVersion,
          nsNgScopedVersion: nsNgScopedVersion,
          nsNgFonticonVersion: nsNgFonticonVersion,
          nsWebpackVersion: nsWebpackVersion,
          ngxTranslateVersion: ngxTranslateVersion,
          nsThemeCoreVersion: nsThemeCoreVersion,
          nsCoreVersion: nsCoreVersion,
          rxjsVersion: rxjsVersion,
          zonejsVersion: zonejsVersion,
          typescriptVersion: typescriptVersion,
          xplatFolderName: XplatHelpers.getXplatFoldername(
            'nativescript',
            'angular'
          ),
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}

/**
 * Add {N} CLI to devDependencies
 */
function addNsCli(add: boolean): Rule {
  if (!add) {
    return noop();
  }

  return (tree: Tree) => {
    const packagePath = 'package.json';
    const packageJson: {
      devDependencies: { [packageName: string]: string };
    } = getJsonFromFile(tree, packagePath);

    if (!packageJson) {
      return tree;
    }

    packageJson.devDependencies = {
      ...(packageJson.devDependencies || {}),
      nativescript: nsCoreVersion,
    };

    return updateJsonFile(tree, packagePath, packageJson);
  };
}
