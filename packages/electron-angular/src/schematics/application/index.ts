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
import { formatFiles } from '@nrwl/workspace';
import {
  stringUtils,
  updateWorkspace,
  updateNxProjects,
  updatePackageScripts,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
  readWorkspaceJson,
} from '@nstudio/xplat';
import {
  prerun,
  getPrefix,
  getNpmScope,
  getJsonFromFile,
  getGroupByName,
  getAppName,
} from '@nstudio/xplat-utils';
import { XplatElectronAngularHelpers } from '../../utils';
import {
  NodePackageInstallTask,
  RunSchematicTask,
} from '@angular-devkit/schematics/tasks';
import { XplatElectrontHelpers } from '@nstudio/electron';
import { workspaceFileName } from '@nrwl/workspace/src/core/file-utils';

export default function (options: XplatElectrontHelpers.SchemaApp) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your Electron app.',
        'nx g @nstudio/electron-angular:app name'
      )
    );
  }
  if (!options.target) {
    throw new SchematicsException(
      missingArgument(
        'target',
        'Provide the name of the web app in your workspace to use inside the electron app.',
        'nx g @nstudio/electron-angular:app name --target web-myapp'
      )
    );
  }

  const packageHandling = [];
  if (options.isTesting) {
    packageHandling.push(
      externalSchematic('@nstudio/electron', 'tools', {
        ...options,
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
      externalSchematic('@nstudio/electron', 'xplat', {
        ...options,
        skipDependentPlatformFiles: true,
      }),
    // use xplat or not
    options.useXplat
      ? externalSchematic('@nstudio/electron-angular', 'xplat', options)
      : noop(),
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, options.name)(tree, context),
    XplatElectronAngularHelpers.updateRootDeps(options),
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
          `The target app name "${fullTargetAppName}" does not appear to be in ${workspaceFileName()}. You may need to generate the app first or perhaps check the spelling.`
        );
      }

      const projects = {};
      const electronAppName = options.name;
      projects[electronAppName] = targetConfig;
      // update to use electron module
      projects[
        electronAppName
      ].architect.build.options.outputPath = `dist/apps/${electronAppName}`;

      if (options.useXplat) {
        projects[
          electronAppName
        ].architect.build.options.main = `apps/${fullTargetAppName}/src/main.electron.ts`;
      }
      projects[electronAppName].architect.build.options.assets.push({
        glob: '**/*',
        input: `apps/${electronAppName}/src/`,
        ignore: ['**/*.ts'],
        output: '',
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
      return updateWorkspace({ projects })(tree, <any>context);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: [],
      };
      return updateNxProjects(tree, projects);
    },
    options.useXplat ? (tree: Tree) => adjustAppFiles(options, tree) : noop(),

    formatFiles({ skipFormat: options.skipFormat }),
    XplatElectrontHelpers.noteAppCommands(options),
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
          xplatFolderName: XplatHelpers.getXplatFoldername(
            'electron',
            'angular'
          ),
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}

function adjustAppFiles(options: XplatElectrontHelpers.SchemaApp, tree: Tree) {
  const fullTargetAppName = options.target;
  const electronModulePath = `/apps/${fullTargetAppName}/src/app/app.electron.module.ts`;
  if (!tree.exists(electronModulePath)) {
    tree.create(electronModulePath, electronModule());
  }
  const electronMainPath = `/apps/${fullTargetAppName}/src/main.electron.ts`;
  if (!tree.exists(electronMainPath)) {
    tree.create(electronMainPath, electronMain());
  }
  return tree;
}

function electronModule() {
  return `import { NgModule } from '@angular/core';
import { ${stringUtils.classify(
    getPrefix()
  )}ElectronCoreModule } from '@${getNpmScope()}/${XplatHelpers.getXplatFoldername(
    'electron',
    'angular'
  )}';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [AppModule, ${stringUtils.classify(getPrefix())}ElectronCoreModule],
  bootstrap: [AppComponent]
})
export class AppElectronModule {}`;
}

function electronMain() {
  return `import { enableProdMode } from '@angular/core';
  import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
  
  // libs
  import { environment } from '@${getNpmScope()}/core';
  
  // app
  import { AppElectronModule } from './app/app.electron.module';
  
  if (environment.production) {
    enableProdMode();
  }
  
  platformBrowserDynamic()
    .bootstrapModule(AppElectronModule)
    .catch(err => console.log(err));
  `;
}
