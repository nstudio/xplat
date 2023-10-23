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
  convertNgTreeToDevKit,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getAppName,
} from '@nstudio/xplat-utils';
import { Schema } from './schema';
import { XplatNativeScriptHelpers } from '../../utils';
import { nsCoreVersion } from '../../utils/versions';
import { addProjectConfiguration, updateProjectConfiguration } from '@nx/devkit';

export default function (options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your NativeScript app.',
        'nx g @nstudio/nativescript:app name'
      )
    );
  }
  // if (options.setupSandbox) {
  //   // always setup routing with sandbox
  //   options.routing = true;
  // }

  return chain([
    prerun(options),
    // adjust naming convention
    XplatHelpers.applyAppNamingConvention(options, 'nativescript'),
    XplatNativeScriptHelpers.addReferences(),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name),
    // add app resources
    (tree: Tree, context: SchematicContext) =>
      // inside closure to ensure it uses the modifed options.name from applyAppNamingConvention
      externalSchematic(
        '@nstudio/nativescript',
        'app-resources',
        {
          path: `apps/${options.name}`,
        },
        { interactive: false }
      )(tree, context),
    // add root package dependencies
    XplatNativeScriptHelpers.updateRootDeps(options),
    XplatNativeScriptHelpers.updatePrettierIgnore(),
    // addInstallTask(),
    // add clean scripts
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
      addProjectConfiguration(convertNgTreeToDevKit(tree,context), options.name, {
          root: `apps/${directory}${options.name}/`,
          sourceRoot: `apps/${directory}${options.name}/src`,
          projectType: 'application',
          targets: {
            build: {
              executor: '@nativescript/nx:build',
              options: {
                noHmr: true,
                production: true,
                uglify: true,
                release: true,
                forDevice: true,
              },
            },
            ios: {
              executor: '@nativescript/nx:build',
              options: {
                platform: 'ios',
              },
              configurations: {
                build: {
                  copyTo: './dist/build.ipa',
                },
              },
            },
            android: {
              executor: '@nativescript/nx:build',
              options: {
                platform: 'android',
              },
              configurations: {
                build: {
                  copyTo: './dist/build.apk',
                },
              },
            },
            clean: {
              executor: '@nativescript/nx:build',
              options: {
                clean: true,
              },
            },
          },
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
          pathOffset: directory ? '../../../' : '../../',
          xplatFolderName: XplatHelpers.getXplatFoldername('nativescript'),
          nsCoreVersion: nsCoreVersion,
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}
