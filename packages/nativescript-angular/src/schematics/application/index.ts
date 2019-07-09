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
  noop
} from '@angular-devkit/schematics';
import {
  stringUtils,
  prerun,
  getNpmScope,
  getPrefix,
  addRootDeps,
  updatePackageScripts,
  updateAngularProjects,
  updateNxProjects,
  applyAppNamingConvention,
  getGroupByName,
  getAppName,
  missingArgument,
  getJsonFromFile,
  setDependency,
  updateJsonFile,
  getDefaultTemplateOptions,
  addInstallTask
} from '@nstudio/workspace';
import { Schema as ApplicationOptions } from './schema';

export default function(options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your NativeScript app.',
        'ng g @nstudio/nativescript:app name'
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
    applyAppNamingConvention(options, 'nativescript'),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name)(tree, context),
    // add features
    (tree: Tree, context: SchematicContext) =>
      options.routing
        ? addAppFiles(
            options,
            options.name,
            'routing'
          )(tree, context)
        : noop()(tree, context),
    // add app resources
    (tree: Tree, context: SchematicContext) =>
      // inside closure to ensure it uses the modifed options.name from applyAppNamingConvention
      schematic('app-resources', {
        path: `apps/${options.name}/app`
      })(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, { nativescript: true }),
    addInstallTask(options),
    addNsCli(options.addCliDependency),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      // standard apps don't have hmr on by default since results can vary
      // more reliable to leave off by default for now
      // however, sandbox setup due to its simplicity uses hmr by default
      let hmr = options.setupSandbox ? ' --hmr' : '';
      scripts[
        `clean`
      ] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      scripts[`start.${platformApp}.ios`] = `cd apps/${
        options.name
      } && tns run ios --emulator --bundle${hmr}`;
      scripts[`start.${platformApp}.android`] = `cd apps/${
        options.name
      } && tns run android --emulator --bundle${hmr}`;
      scripts[`start.${platformApp}.preview`] = `cd apps/${
        options.name
      } && tns preview --bundle${hmr}`;
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
        sourceRoot: `apps/${options.name}/app`,
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
  options: ApplicationOptions,
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

    packageJson.devDependencies = setDependency(packageJson.devDependencies, {
      name: 'nativescript',
      version: '^5.0.0',
      type: 'devDependency'
    });

    return updateJsonFile(tree, packagePath, packageJson);
  };
}
