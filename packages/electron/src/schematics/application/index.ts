import {
  chain,
  Tree,
  SchematicContext,
  SchematicsException,
  branchAndMerge,
  Rule,
  mergeWith,
  apply,
  url,
  template,
  move,
  noop,
  externalSchematic
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import {
  prerun,
  getPrefix,
  getNpmScope,
  stringUtils,
  updateWorkspace,
  updateNxProjects,
  getJsonFromFile,
  updatePackageScripts,
  getGroupByName,
  getAppName,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
  readWorkspaceJson
} from '@nstudio/xplat';
import { XplatElectrontHelpers } from '../../utils';
import {
  NodePackageInstallTask,
  RunSchematicTask
} from '@angular-devkit/schematics/tasks';
import { workspaceFileName } from '@nrwl/workspace/src/core/file-utils';

export default function(options: XplatElectrontHelpers.SchemaApp) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your Electron app.',
        'nx g @nstudio/electron:app name'
      )
    );
  }
  if (!options.target) {
    throw new SchematicsException(
      `Missing target argument. Provide the name of the web app in your workspace to use inside the electron app. ie, web-myapp`
    );
  }

  const packageHandling = [];
  if (options.isTesting) {
    packageHandling.push(
      externalSchematic('@nstudio/electron', 'tools', {
        ...options
      })
    );
  } else {
    // TODO: find a way to unit test schematictask runners with install tasks
    packageHandling.push((tree: Tree, context: SchematicContext) => {
      const installPackageTask = context.addTask(new NodePackageInstallTask());

      // console.log('packagesToRunXplat:', packagesToRunXplat);
      context.addTask(
        new RunSchematicTask('@nstudio/electron', 'tools', options),
        [installPackageTask]
      );
    });
  }

  return chain([
    prerun(options),
    XplatHelpers.applyAppNamingConvention(options, 'electron'),
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name)(tree, context),
    XplatElectrontHelpers.updateRootDeps(options),
    ...packageHandling,
    XplatElectrontHelpers.addNpmScripts(options),
    (tree: Tree, context: SchematicContext) => {
      // grab the target app configuration
      const workspaceConfig = readWorkspaceJson(tree);
      // find app
      const fullTargetAppName = options.target;
      let targetConfig;
      if (workspaceConfig && workspaceConfig.projects) {
        targetConfig = workspaceConfig.projects[fullTargetAppName];
      }
      if (!targetConfig) {
        throw new SchematicsException(
          `The target app name "${fullTargetAppName}" does not appear to be in ${workspaceFileName()}. You may need to generate it first or perhaps check the spelling.`
        );
      }

      const projects = {};
      const electronAppName = options.name;
      const directory = options.directory ? `${options.directory}/` : '';
      projects[electronAppName] = targetConfig;
      // update to use electron module
      projects[
        electronAppName
      ].architect.build.options.outputPath = `dist/apps/${directory}${electronAppName}`;
      projects[
        electronAppName
      ].architect.build.options.main = `apps/${directory}${fullTargetAppName}/src/main.ts`;
      projects[electronAppName].architect.build.options.assets.push({
        glob: '**/*',
        input: `apps/${directory}${electronAppName}/src/`,
        ignore: ['**/*.ts'],
        output: ''
      });
      projects[
        electronAppName
      ].architect.serve.options.browserTarget = `${electronAppName}:build`;
      projects[
        electronAppName
      ].architect.serve.configurations.production.browserTarget = `${electronAppName}:build:production`;
      // clear other settings (TODO: may need these in future), for now keep electron options minimal
      delete projects[electronAppName].architect['extract-i18n'];
      delete projects[electronAppName].architect['test'];
      delete projects[electronAppName].architect['lint'];
      return updateWorkspace({ projects })(tree, context);
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

function addAppFiles(
  options: XplatElectrontHelpers.SchemaApp,
  appPath: string
): Rule {
  const appname = getAppName(options, 'electron');
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          appname,
          xplatFolderName: XplatHelpers.getXplatFoldername('electron')
        }),
        move(`apps/${directory}${appPath}`)
      ])
    )
  );
}
