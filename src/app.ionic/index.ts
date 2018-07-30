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
  TemplateOptions,
  SchematicContext,
  SchematicsException,
  schematic,
  noop,
} from '@angular-devkit/schematics';
import { stringUtils, prerun, getNpmScope, getPrefix, addRootDepsIonic, updatePackageScripts, updateAngularProjects, updateNxProjects, formatFiles } from '../utils';
import { Schema as ApplicationOptions } from './schema';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(`Missing name argument. Provide a name for your Ionic app. Example: ng g app.ionic sample`);
  }
  const appPath = `ionic-${options.name}`;
  const xplat = options.xplat;

  return chain([
    prerun(options.prefix),
    // create app files
    (tree: Tree, context: SchematicContext) => addAppFiles(options, appPath)(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDepsIonic(tree),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      // ensure convenient clean script is added for workspace
      scripts[`clean`] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      // add convenient ionic scripts
      scripts[`build.ionic.${options.name}`] = `cd apps/ionic-${options.name} && npm run build:web`;
      scripts[`prepare.ionic.${options.name}`] = `npm run clean && npm run clean.ionic.${options.name} && npm run build.ionic.${options.name}`;
      scripts[`prepare.ionic.${options.name}.ios`] = `npm run prepare.ionic.${options.name} && cd apps/ionic-${options.name} && npm run cap.add.ios`;
      scripts[`prepare.ionic.${options.name}.android`] = `npm run prepare.ionic.${options.name} && cd apps/ionic-${options.name} && npm run cap.add.android`;
      scripts[`open.ionic.${options.name}.ios`] = `cd apps/ionic-${options.name} && npm run cap.ios`;
      scripts[`open.ionic.${options.name}.android`] = `cd apps/ionic-${options.name} && npm run cap.android`;
      scripts[`sync.ionic.${options.name}`] = `cd apps/ionic-${options.name} && npm run cap.copy`;
      scripts[`start.ionic.${options.name}`] = `cd apps/ionic-${options.name} && npm start`;
      scripts[`clean.ionic.${options.name}`] = `cd apps/ionic-${options.name} && npx rimraf -- hooks node_modules platforms www plugins ios android package-lock.json && npm i && rimraf -- package-lock.json`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`ionic-${options.name}`] = {
        "root": `apps/ionic-${options.name}/`,
        "sourceRoot": `apps/ionic-${options.name}/src`,
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
      projects[`ionic-${options.name}`] = {
        tags: []
      };
      return updateNxProjects(tree, projects);
    },
    // add xplat if specified
    xplat ?
      schematic('xplat', {
        ...options as any,
        platforms: 'web,ionic',
        prefix: getPrefix(),
        onlyIfNone: true,
      }) : noop(),
    options.skipFormat 
      ? noop()
      : formatFiles(options)
  ]);
}

function addAppFiles(options: ApplicationOptions, appPath: string, sample: string = ''): Rule {
  sample = '';
  return branchAndMerge(
    mergeWith(apply(url(`./_${sample}files`), [
      template(<TemplateOptions>{
        ...options as any,
        utils: stringUtils,
        npmScope: getNpmScope(),
        prefix: getPrefix(),
        dot: '.',
      }),
      move(`apps/${appPath}`)
    ]))
  );
}
