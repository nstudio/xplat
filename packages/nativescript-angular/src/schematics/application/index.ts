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
  prerun,
  getPrefix,
  updatePackageScripts,
  updateWorkspace,
  updateNxProjects,
  getAppName,
  missingArgument,
  getJsonFromFile,
  updateJsonFile,
  getDefaultTemplateOptions,
  XplatHelpers,
  updateTsConfig
} from '@nstudio/xplat';
import { Schema } from './schema';
import { XplatNativeScriptAngularHelpers } from '../../utils';
import {
  nsCoreVersion,
  angularVersion,
  nsNgVersion,
  nsNgScopedVersion,
  nsIntlVersion,
  nsNgFonticonVersion,
  ngxTranslateVersion,
  nsThemeCoreVersion,
  codelyzerVersion,
  terserWebpackVersion,
  tslibVersion,
  reflectMetadataVersion,
  rxjsVersion,
  zonejsVersion,
  nsDevWebpackVersion,
  typescriptVersion
} from '../../utils/versions';
import { XplatNativeScriptHelpers } from '@nstudio/nativescript/src/utils';

export default function(options: Schema) {
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
          path: `apps/${directory}${options.name}`
        },
        { interactive: false }
      )(tree, context);
    },
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
    XplatNativeScriptAngularHelpers.updateRootDeps(options),
    XplatNativeScriptHelpers.updatePrettierIgnore(),
    XplatHelpers.addPackageInstallTask(options),
    addNsCli(options.addCliDependency),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      scripts[
        `clean`
      ] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      scripts[
        `start.${platformApp}.ios`
      ] = `cd apps/${directory}${options.name} && tns debug ios --env.aot --no-hmr --emulator`;
      scripts[
        `start.${platformApp}.android`
      ] = `cd apps/${directory}${options.name} && tns debug android --env.aot --no-hmr --emulator`;
      scripts[
        `clean.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npx rimraf -- hooks node_modules platforms package-lock.json && npm i && npx rimraf -- package-lock.json`;
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
        schematics: {
          '@schematics/angular:component': {
            styleext: 'scss'
          }
        },
        architect: {
          serve: {
            builder: '@nrwl/workspace:run-commands',
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
      return updateWorkspace({ projects })(tree, context);
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
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          appname,
          pathOffset: directory ? '../../../' : '../../',
          angularVersion: angularVersion,
          nsNgScopedVersion: nsNgScopedVersion,
          nsNgVersion: nsNgVersion,
          nsIntlVersion: nsIntlVersion,
          nsNgFonticonVersion: nsNgFonticonVersion,
          nsDevWebpackVersion: nsDevWebpackVersion,
          ngxTranslateVersion: ngxTranslateVersion,
          nsThemeCoreVersion: nsThemeCoreVersion,
          nsCoreVersion: nsCoreVersion,
          terserWebpackVersion: terserWebpackVersion,
          tslibVersion: tslibVersion,
          reflectMetadataVersion: reflectMetadataVersion,
          rxjsVersion: rxjsVersion,
          zonejsVersion: zonejsVersion,
          codelyzerVersion: codelyzerVersion,
          typescriptVersion: typescriptVersion,
          xplatFolderName: XplatHelpers.getXplatFoldername(
            'nativescript',
            'angular'
          )
        }),
        move(`apps/${directory}${appPath}`)
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
      nativescript: nsCoreVersion
    };

    return updateJsonFile(tree, packagePath, packageJson);
  };
}
