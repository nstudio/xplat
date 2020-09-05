import {
  XplatHelpers,
  missingArgument,
  getDefaultTemplateOptions,
  updateWorkspace,
  updateNxProjects,
  updatePackageScripts,
} from '@nstudio/xplat';
import { prerun, getAppName, getPrefix } from '@nstudio/xplat-utils';
import {
  chain,
  noop,
  Tree,
  SchematicContext,
  SchematicsException,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
} from '@angular-devkit/schematics';
import { Schema } from './schema';
import { XplatIonicHelpers } from '../../utils';
import { capacitorVersion } from '../../utils/versions';
import { formatFiles } from '@nrwl/workspace';

export default function (options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your Ionic app.',
        'nx g @nstudio/ionic:app name'
      )
    );
  }

  return chain([
    prerun(options),
    // adjust naming convention
    XplatHelpers.applyAppNamingConvention(options, 'ionic'),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name)(tree, context),
    // add root package dependencies
    XplatIonicHelpers.updateRootDeps(options),
    XplatHelpers.addPackageInstallTask(options),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      // ensure convenient clean script is added for workspace
      scripts[
        `clean`
      ] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      scripts[
        `start.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npm start`;
      scripts[
        `build.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npm run build:ionic`;
      scripts[
        `prepare.${platformApp}`
      ] = `npm run clean && npm run clean.${platformApp} && npm run build.${platformApp}`;
      scripts[
        `prepare.${platformApp}.ios`
      ] = `npm run prepare.${platformApp} && cd apps/${directory}${options.name} && npm run cap.add.ios`;
      scripts[
        `prepare.${platformApp}.android`
      ] = `npm run prepare.${platformApp} && cd apps/${directory}${options.name} && npm run cap.add.android`;
      scripts[
        `open.${platformApp}.ios`
      ] = `cd apps/${directory}${options.name} && npm run cap.ios`;
      scripts[
        `open.${platformApp}.android`
      ] = `cd apps/${directory}${options.name} && npm run cap.android`;
      scripts[
        `sync.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npm run cap.copy`;
      scripts[
        `clean.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npx rimraf -- hooks node_modules platforms www plugins ios android package-lock.json && npm i && rimraf -- package-lock.json`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree, context: SchematicContext) => {
      const directory = options.directory ? `${options.directory}/` : '';
      const projects = {};
      projects[`${options.name}`] = {
        root: `apps/${directory}${options.name}/`,
        sourceRoot: `apps/${directory}${options.name}/src`,
        projectType: 'application',
        prefix: getPrefix(),
      };
      return <any>updateWorkspace({ projects })(tree, <any>context);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: [],
      };
      return updateNxProjects(tree, projects);
    },
    <any>formatFiles({ skipFormat: options.skipFormat }),
  ]);
}

function addAppFiles(options: Schema, appPath: string) {
  const appname = getAppName(options, 'ionic');
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          pathOffset: directory ? '../../../' : '../../',
          appname,
          xplatFolderName: XplatHelpers.getXplatFoldername('ionic'),
          capacitorVersion,
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}
