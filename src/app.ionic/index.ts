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
} from '@angular-devkit/schematics';
import { stringUtils, prerun, getNpmScope, getPrefix, addRootDeps, updatePackageScripts, updateAngularProjects, updateNxProjects, formatFiles, applyAppNamingConvention, getAppName, missingArgument } from '../utils';
import { Schema as ApplicationOptions } from './schema';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument('name', 'Provide a name for your Ionic app.', 'ng g app.ionic sample')
    );
  }

  return chain([
    prerun(options),
    // adjust naming convention
    applyAppNamingConvention(options, 'ionic'),
    // create app files
    (tree: Tree, context: SchematicContext) => addAppFiles(options, options.name)(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, {ionic: true}),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      const platformApp = options.name.replace('-', '.');
      // ensure convenient clean script is added for workspace
      scripts[`clean`] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      // add convenient ionic scripts
      scripts[`build.${platformApp}`] = `cd apps/${options.name} && npm run build:web`;
      scripts[`prepare.${platformApp}`] = `npm run clean && npm run clean.${platformApp} && npm run build.${platformApp}`;
      scripts[`prepare.${platformApp}.ios`] = `npm run prepare.${platformApp} && cd apps/${options.name} && npm run cap.add.ios`;
      scripts[`prepare.${platformApp}.android`] = `npm run prepare.${platformApp} && cd apps/${options.name} && npm run cap.add.android`;
      scripts[`open.${platformApp}.ios`] = `cd apps/${options.name} && npm run cap.ios`;
      scripts[`open.${platformApp}.android`] = `cd apps/${options.name} && npm run cap.android`;
      scripts[`sync.${platformApp}`] = `cd apps/${options.name} && npm run cap.copy`;
      scripts[`start.${platformApp}`] = `cd apps/${options.name} && npm start`;
      scripts[`clean.${platformApp}`] = `cd apps/${options.name} && npx rimraf -- hooks node_modules platforms www plugins ios android package-lock.json && npm i && rimraf -- package-lock.json`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        "root": `apps/${options.name}/`,
        "sourceRoot": `apps/${options.name}/src`,
        "projectType": "application",
        "prefix": getPrefix(),
        "schematics": {
          "@schematics/angular:component": {
            "styleext": "scss"
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
    options.skipFormat 
      ? noop()
      : formatFiles(options)
  ]);
}

function addAppFiles(options: ApplicationOptions, appPath: string, sample: string = ''): Rule {
  sample = '';
  const appname = getAppName(options, 'ionic');
  return branchAndMerge(
    mergeWith(apply(url(`./_${sample}files`), [
      template({
        ...options as any,
        appname,
        utils: stringUtils,
        npmScope: getNpmScope(),
        prefix: getPrefix(),
        dot: '.',
      }),
      move(`apps/${appPath}`)
    ]))
  );
}
