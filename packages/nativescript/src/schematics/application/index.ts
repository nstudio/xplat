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
  updateWorkspace,
  updateNxProjects,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
  updateTsConfig,
  output,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getAppName,
} from '@nstudio/xplat-utils';
import { Schema } from './schema';
import { XplatNativeScriptHelpers } from '../../utils';

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
    // adjust root tsconfig
    (tree: Tree, context: SchematicContext) => {
      return updateTsConfig(tree, (tsConfig: any) => {
        if (tsConfig) {
          if (!tsConfig.exclude) {
            tsConfig.exclude = [];
          }
          const excludeNSApps = 'apps/nativescript-*';
          if (!tsConfig.exclude.includes(excludeNSApps)) {
            tsConfig.exclude.push(excludeNSApps);
          }
          if (!tsConfig.includes) {
            tsConfig.includes = [];
          }
          const platformFiles = 'xplat/**/*.{ios,android}.ts';
          if (!tsConfig.includes.includes(platformFiles)) {
            tsConfig.includes.push(platformFiles);
          }
        }
      });
    },
    // add root package dependencies
    XplatNativeScriptHelpers.updateRootDeps(options),
    XplatNativeScriptHelpers.updatePrettierIgnore(),
    XplatHelpers.addPackageInstallTask(options),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      // standard apps don't have hmr on by default since results can vary
      // more reliable to leave off by default for now
      // however, sandbox setup due to its simplicity uses hmr by default
      scripts[
        `clean`
      ] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree, context: SchematicContext) => {
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      const projects = {};
      projects[`${options.name}`] = {
        root: `apps/${directory}${options.name}/`,
        sourceRoot: `apps/${directory}${options.name}/src`,
        projectType: 'application',
        prefix: getPrefix(),
        architect: {
          ios: {
            builder: '@nrwl/workspace:run-commands',
            options: {
              commands: [
                `ns debug ios --no-hmr --env.configuration={args.configuration} --env.projectName=${options.name}`,
              ],
              cwd: `apps/${directory}${options.name}`,
              parallel: false,
            },
          },
          android: {
            builder: '@nrwl/workspace:run-commands',
            options: {
              commands: [
                `ns debug android --no-hmr --env.configuration={args.configuration} --env.projectName=${options.name}`,
              ],
              cwd: `apps/${directory}${options.name}`,
              parallel: false,
            },
          },
          clean: {
            builder: '@nrwl/workspace:run-commands',
            options: {
              commands: ['ns clean', 'npm i', 'npx rimraf package-lock.json'],
              cwd: `apps/${directory}${options.name}`,
              parallel: false,
            },
          },
        },
      };
      return updateWorkspace({ projects })(tree, <any>context);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: [],
      };
      return updateNxProjects(tree, projects);
    },
    (tree: Tree) => {
      output.log({
        title: 'You will be able to run your app with:',
        bodyLines: [
          `nx run ${options.name}:ios`,
          `   `,
          `nx run ${options.name}:android`,
          `   `,
          `You can also clean/reset the app anytime with:`,
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
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}
