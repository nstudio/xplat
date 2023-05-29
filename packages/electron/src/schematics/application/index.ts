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
  externalSchematic,
} from '@angular-devkit/schematics';
import { formatFiles, updateWorkspace } from '@nx/workspace';
import {
  stringUtils,
  updatePackageScripts,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
  readWorkspaceJson,
  convertNgTreeToDevKit,
} from '@nstudio/xplat';
import {
  prerun,
  getPrefix,
  getNpmScope,
  getJsonFromFile,
  getGroupByName,
  getAppName,
} from '@nstudio/xplat-utils';
import { XplatElectrontHelpers } from '../../utils';
import { addProjectConfiguration, readProjectConfiguration } from '@nx/devkit';

export default function (options: XplatElectrontHelpers.SchemaApp) {
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

  return chain([
    prerun(options),
    XplatHelpers.applyAppNamingConvention(options, 'electron'),
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name)(tree, context),
    XplatElectrontHelpers.updateRootDeps(options),
    XplatElectrontHelpers.addNpmScripts(options),
    (tree: Tree, context: SchematicContext) => {
      // grab the target app configuration
      // find app
      const fullTargetAppName = options.target;
      const nxTree = convertNgTreeToDevKit(tree, context);
      const projectConfig = readProjectConfiguration(nxTree, fullTargetAppName);
      
      if (!projectConfig) {
        throw new SchematicsException(
          `The target app name "${fullTargetAppName}" does not appear to be in the workspace. You may need to generate it first or perhaps check the spelling.`
        );
      }

      const electronAppName = options.name;
      const directory = options.directory ? `${options.directory}/` : '';
      if (!projectConfig.root) {
        projectConfig.root = `apps/${directory}${electronAppName}`;
      }
      let targetProp = 'architect';
      if (!projectConfig[targetProp]) {
        targetProp = 'targets'; // nx 11 moved to 'targets'
      }
      if (projectConfig[targetProp]) {
        // update to use electron module
        projectConfig[
          targetProp
        ].build.options.outputPath = `dist/apps/${directory}${electronAppName}`;
        projectConfig[
          targetProp
        ].build.options.main = `apps/${directory}${fullTargetAppName}/src/main.ts`;
        projectConfig[targetProp].build.options.assets.push({
          glob: '**/*',
          input: `apps/${directory}${electronAppName}/src/`,
          ignore: ['**/*.ts'],
          output: '',
        });
        projectConfig[
          targetProp
        ].serve.options.browserTarget = `${electronAppName}:build`;
        projectConfig[
          targetProp
        ].serve.configurations.production.browserTarget = `${electronAppName}:build:production`;
        // clear other settings (TODO: may need these in future), for now keep electron options minimal
        delete projectConfig[targetProp]['extract-i18n'];
        delete projectConfig[targetProp]['test'];
        delete projectConfig[targetProp]['lint'];
      }
      addProjectConfiguration(nxTree, electronAppName, projectConfig);
    },

    formatFiles({ skipFormat: options.skipFormat }),
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
          xplatFolderName: XplatHelpers.getXplatFoldername('electron'),
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}
