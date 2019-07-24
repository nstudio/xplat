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
import { formatFiles } from '@nrwl/workspace';
import {
  stringUtils,
  prerun,
  getNpmScope,
  getPrefix,
  updatePackageScripts,
  updateAngularProjects,
  updateNxProjects,
  getAppName,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers
} from '@nstudio/xplat';
import { Schema as ApplicationOptions } from './schema';
import { XplatIonicAngularHelpers } from '../../utils';

export default function(options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your Ionic app.',
        'ng g @nstudio/ionic-angular:app name'
      )
    );
  }

  return chain([
    prerun(options),
    // adjust naming convention
    XplatHelpers.applyAppNamingConvention(options, 'ionic'),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/ionic', 'xplat', {
        ...options,
        skipDependentPlatformFiles: true
      }),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name)(tree, context),
    // add root package dependencies
    XplatIonicAngularHelpers.updateRootDeps(options),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      // ensure convenient clean script is added for workspace
      scripts[
        `clean`
      ] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      // add convenient ionic scripts
      scripts[`build.${platformApp}`] = `cd apps/${directory}${
        options.name
      } && npm run build:web`;
      scripts[
        `prepare.${platformApp}`
      ] = `npm run clean && npm run clean.${platformApp} && npm run build.${platformApp}`;
      scripts[
        `prepare.${platformApp}.ios`
      ] = `npm run prepare.${platformApp} && cd apps/${directory}${
        options.name
      } && npm run cap.add.ios`;
      scripts[
        `prepare.${platformApp}.android`
      ] = `npm run prepare.${platformApp} && cd apps/${directory}${
        options.name
      } && npm run cap.add.android`;
      scripts[`open.${platformApp}.ios`] = `cd apps/${directory}${
        options.name
      } && npm run cap.ios`;
      scripts[`open.${platformApp}.android`] = `cd apps/${directory}${
        options.name
      } && npm run cap.android`;
      scripts[`sync.${platformApp}`] = `cd apps/${directory}${
        options.name
      } && npm run cap.copy`;
      scripts[`start.${platformApp}`] = `cd apps/${directory}${
        options.name
      } && npm start`;
      scripts[`clean.${platformApp}`] = `cd apps/${directory}${
        options.name
      } && npx rimraf -- hooks node_modules platforms www plugins ios android package-lock.json && npm i && rimraf -- package-lock.json`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      const directory = options.directory ? `${options.directory}/` : '';
      const projects = {};
      projects[`${options.name}`] = {
        root: `apps/${directory}${options.name}/`,
        sourceRoot: `apps/${directory}${options.name}/src`,
        projectType: 'application',
        prefix: getPrefix(),
        schematics: {
          '@schematics/angular:component': {
            styleext: 'scss'
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
    },
    formatFiles({ skipFormat: options.skipFormat })
  ]);
}

function addAppFiles(options: ApplicationOptions, appPath: string): Rule {
  const appname = getAppName(options, 'ionic');
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          appname,
          xplatFolderName: XplatHelpers.getXplatFoldername('ionic', 'angular')
        }),
        move(`apps/${directory}${appPath}`)
      ])
    )
  );
}
