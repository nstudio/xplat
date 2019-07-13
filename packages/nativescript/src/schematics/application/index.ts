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
  externalSchematic
} from '@angular-devkit/schematics';
import {
  stringUtils,
  prerun,
  getNpmScope,
  getPrefix,
  updatePackageScripts,
  updateAngularProjects,
  updateNxProjects,
  getGroupByName,
  getAppName,
  missingArgument,
  getJsonFromFile,
  setDependency,
  updateJsonFile,
  getDefaultTemplateOptions,
  XplatHelpers
} from '@nstudio/xplat';
import { Schema } from './schema';
import { XplatNativeScriptHelpers } from '../../utils';

export default function(options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your NativeScript app.',
        'ng g @nstudio/nativescript:app name'
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
    // add features
    // (tree: Tree, context: SchematicContext) =>
    //   options.routing
    //     ? addAppFiles(
    //         options,
    //         options.name,
    //         'routing'
    //       )(tree, context)
    //     : noop()(tree, context),
    // add app resources
    (tree: Tree, context: SchematicContext) =>
      // inside closure to ensure it uses the modifed options.name from applyAppNamingConvention
      externalSchematic(
        '@nstudio/nativescript',
        'app-resources',
        {
          path: `apps/${options.name}`
        },
        { interactive: false }
      )(tree, context),
    // add root package dependencies
    XplatNativeScriptHelpers.updateRootDeps(options),
    XplatHelpers.addPackageInstallTask(options),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      // standard apps don't have hmr on by default since results can vary
      // more reliable to leave off by default for now
      // however, sandbox setup due to its simplicity uses hmr by default
      scripts[
        `clean`
      ] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      scripts[`start.${platformApp}.ios`] = `cd apps/${
        options.name
      } && tns run ios --emulator`;
      scripts[`start.${platformApp}.android`] = `cd apps/${
        options.name
      } && tns run android --emulator`;
      scripts[`start.${platformApp}.preview`] = `cd apps/${
        options.name
      } && tns preview`;
      scripts[`clean.${platformApp}`] = `cd apps/${
        options.name
      } && npx rimraf -- hooks node_modules platforms package-lock.json && npm i && npx rimraf -- package-lock.json`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      const projects = {};
      projects[`${options.name}`] = {
        root: `apps/${options.name}/`,
        sourceRoot: `apps/${options.name}/src`,
        projectType: 'application',
        prefix: getPrefix(),
        schematics: {
          '@schematics/angular:component': {
            styleext: 'scss'
          }
        },
        architect: {
          serve: {
            builder: '@nrwl/builders:run-commands',
            options: {
              commands: [
                {
                  command: `yarn start.${platformApp}.preview`
                }
              ]
            },
            configurations: {
              ios: {
                commands: [
                  {
                    command: `yarn start.${platformApp}.ios`
                  }
                ]
              },
              android: {
                commands: [
                  {
                    command: `yarn start.${platformApp}.android`
                  }
                ]
              }
            }
          }
        }
      };
      return updateAngularProjects(tree, projects);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: []
      };
      return updateNxProjects(tree, projects);
    }
  ]);
}

function addAppFiles(
  options: Schema,
  appPath: string,
  extra: string = ''
): Rule {
  extra = extra ? `${extra}_` : '';
  const appname = getAppName(options, 'nativescript');
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          appname
        }),
        move(`apps/${appPath}`)
      ])
    )
  );
}
