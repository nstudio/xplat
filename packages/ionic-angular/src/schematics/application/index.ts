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
import { addInstallTask, formatFiles, updateWorkspace } from '@nrwl/workspace';
import {
  stringUtils,
  updatePackageScripts,
  updateNxProjects,
  missingArgument,
  getDefaultTemplateOptions,
  XplatHelpers,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getAppName,
} from '@nstudio/xplat-utils';
import { Schema as ApplicationOptions } from './schema';
import { XplatIonicAngularHelpers } from '../../utils';
import {
  capacitorVersion,
  capacitorPluginsVersion,
} from '../../utils/versions';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide a name for your Ionic app.',
        'nx g @nstudio/ionic-angular:app name'
      )
    );
  }

  return chain([
    prerun(options),
    // adjust naming convention
    XplatHelpers.applyAppNamingConvention(options, 'ionic'),
    // use xplat or not
    (tree: Tree, context: SchematicContext) =>
      options.useXplat
        ? externalSchematic('@nstudio/angular', 'xplat', {
            ...options,
            platforms: 'ionic,web',
          })
        : externalSchematic('@nstudio/ionic', 'xplat', {
            ...options,
            skipDependentPlatformFiles: true,
          }),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(
        options,
        options.name,
        options.useXplat ? '' : 'skipxplat'
      )(tree, context),
    // add root package dependencies
    XplatIonicAngularHelpers.updateRootDeps(options),
    // addInstallTask(),
    // XplatHelpers.addPackageInstallTask(options),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      const directory = options.directory ? `${options.directory}/` : '';
      // ensure convenient clean script is added for workspace
      scripts[
        `clean`
      ] = `npx rimraf hooks node_modules package-lock.json && yarn config set ignore-engines true && yarn`;
      // add convenient ionic scripts
      scripts[
        `prepare.${platformApp}.ios`
      ] = `cd apps/${directory}${options.name} && npm run cap.add.ios`;
      scripts[
        `prepare.${platformApp}.android`
      ] = `cd apps/${directory}${options.name} && npm run cap.add.android`;
      scripts[
        `open.${platformApp}.ios`
      ] = `cd apps/${directory}${options.name} && npm run cap.ios`;
      scripts[
        `open.${platformApp}.android`
      ] = `cd apps/${directory}${options.name} && npm run cap.android`;
      scripts[
        `sync.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npm run cap.sync`;
      scripts[
        `clean.${platformApp}`
      ] = `cd apps/${directory}${options.name} && npx rimraf hooks node_modules platforms www plugins package-lock.json && yarn config set ignore-engines true && yarn`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree, context: SchematicContext) => {
      const directory = options.directory ? `${options.directory}/` : '';
      const appFolder = `apps/${directory}${options.name}/`;
      return updateWorkspace((workspace) => {
        workspace.projects.add({
          name: options.name,
          root: appFolder,
          sourceRoot: `${appFolder}src`,
          projectType: 'application',
          prefix: getPrefix(),
          schematics: {
            '@schematics/angular:component': {
              styleext: 'scss',
            },
          },
          targets: {
            build: {
              builder: '@angular-devkit/build-angular:browser',
              options: {
                outputPath: `${appFolder}www`,
                index: `${appFolder}src/index.html`,
                main: `${appFolder}src/main.ts`,
                polyfills: `${appFolder}src/polyfills.ts`,
                tsConfig: `${appFolder}tsconfig.app.json`,
                assets: [
                  {
                    glob: '**/*',
                    input: `${appFolder}src/assets`,
                    output: 'assets',
                  },
                  {
                    glob: '**/*.svg',
                    input: 'node_modules/ionicons/dist/ionicons/svg',
                    output: './svg',
                  },
                ],
                styles: [
                  {
                    input: `${appFolder}src/theme/variables.scss`,
                  },
                  {
                    input: `${appFolder}src/global.scss`,
                  },
                ],
                scripts: [],
                aot: false,
                vendorChunk: true,
                extractLicenses: false,
                buildOptimizer: false,
                sourceMap: true,
                optimization: false,
                namedChunks: true,
              },
              configurations: {
                production: {
                  fileReplacements: [
                    {
                      replace: `${appFolder}src/environments/environment.ts`,
                      with: `${appFolder}src/environments/environment.prod.ts`,
                    },
                  ],
                  optimization: true,
                  outputHashing: 'all',
                  sourceMap: false,
                  namedChunks: false,
                  aot: true,
                  extractLicenses: true,
                  vendorChunk: false,
                  buildOptimizer: true,
                  budgets: [
                    {
                      type: 'initial',
                      maximumWarning: '2mb',
                      maximumError: '5mb',
                    },
                  ],
                },
                ci: {
                  progress: false,
                },
              },
            },
            serve: {
              builder: '@angular-devkit/build-angular:dev-server',
              options: {
                browserTarget: `${options.name}:build`,
              },
              configurations: {
                production: {
                  browserTarget: `${options.name}:build:production`,
                },
                ci: {
                  progress: false,
                },
              },
            },
            'extract-i18n': {
              builder: '@angular-devkit/build-angular:extract-i18n',
              options: {
                browserTarget: `${options.name}:build`,
              },
            },
            test: {
              builder: '@angular-devkit/build-angular:karma',
              options: {
                main: `${appFolder}src/test.ts`,
                polyfills: `${appFolder}src/polyfills.ts`,
                tsConfig: `${appFolder}tsconfig.spec.json`,
                karmaConfig: `${appFolder}karma.conf.js`,
                styles: [],
                scripts: [],
                assets: [
                  {
                    glob: 'favicon.ico',
                    input: `${appFolder}src/`,
                    output: '/',
                  },
                  {
                    glob: '**/*',
                    input: `${appFolder}src/assets`,
                    output: '/assets',
                  },
                ],
              },
              configurations: {
                ci: {
                  progress: false,
                  watch: false,
                },
              },
            },
            lint: {
              builder: '@angular-eslint/builder:lint',
              options: {
                tsConfig: [
                  `${appFolder}tsconfig.app.json`,
                  `${appFolder}tsconfig.spec.json`,
                  `${appFolder}e2e/tsconfig.json`,
                ],
                lintFilePatterns: ['src/**/*.ts', 'src/**/*.html'],
              },
            },
            // TODO: add jest e2e configuration for ionic
            // e2e: {
            //   builder: '@angular-devkit/build-angular:protractor',
            //   options: {
            //     protractorConfig: `${appFolder}e2e/protractor.conf.js`,
            //     devServerTarget: `${options.name}:serve`
            //   },
            //   configurations: {
            //     production: {
            //       devServerTarget: `${options.name}:serve:production`
            //     },
            //     ci: {
            //       devServerTarget: `${options.name}:serve:ci`
            //     }
            //   }
            // },
            'ionic-cordova-build': {
              builder: '@ionic/angular-toolkit:cordova-build',
              options: {
                browserTarget: `${options.name}:build`,
              },
              configurations: {
                production: {
                  browserTarget: `${options.name}:build:production`,
                },
              },
            },
            'ionic-cordova-serve': {
              builder: '@ionic/angular-toolkit:cordova-serve',
              options: {
                cordovaBuildTarget: `${options.name}:ionic-cordova-build`,
                devServerTarget: `${options.name}:serve`,
              },
              configurations: {
                production: {
                  cordovaBuildTarget: `${options.name}:ionic-cordova-build:production`,
                  devServerTarget: `${options.name}:serve:production`,
                },
              },
            },
          },
        });
      });
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

function addAppFiles(
  options: ApplicationOptions,
  appPath: string,
  extra: string = ''
): Rule {
  extra = extra ? `${extra}_` : '';
  const appname = getAppName(options, 'ionic');
  const directory = options.directory ? `${options.directory}/` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          pathOffset: directory ? '../../../' : '../../',
          appname,
          xplatFolderName: XplatHelpers.getXplatFoldername('ionic', 'angular'),
          capacitorVersion,
          capacitorPluginsVersion,
        }),
        move(`apps/${directory}${appPath}`),
      ])
    )
  );
}
