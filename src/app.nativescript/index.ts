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
import { stringUtils, prerun, getNpmScope, getPrefix, addRootDeps, updatePackageScripts, updateAngularProjects, updateNxProjects } from '../utils';
import { Schema as ApplicationOptions } from './schema';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(`Missing name argument. Provide a name for your NativeScript app. Example: ng g app.nativescript sample`);
  }
  const appPath = `nativescript-${options.name}`;

  return chain([
    prerun(options.prefix),
    // create app files
    (tree: Tree, context: SchematicContext) => addAppFiles(options, appPath)(tree, context),
    // add sample feature
    (tree: Tree, context: SchematicContext) => options.sample || options.routing ? addAppFiles(options, appPath, options.sample ? 'sample' : 'routing')(tree, context) : noop()(tree, context),
    // add app resources
    schematic('app-resources', {
      path: `apps/${appPath}/app`,
    }),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, {nativescript: true}),
    // add start/clean scripts
    (tree: Tree) => {
      const scripts = {};
      scripts[`clean`] = `npx rimraf -- hooks node_modules package-lock.json && npm i`;
      scripts[`start.nativescript.${options.name}.ios`] = `cd apps/nativescript-${options.name} && tns run ios --emulator --bundle --hmr`;
      scripts[`start.nativescript.${options.name}.android`] = `cd apps/nativescript-${options.name} && tns run android --emulator --bundle --hmr`;
      scripts[`clean.nativescript.${options.name}`] = `cd apps/nativescript-${options.name} && npx rimraf -- hooks node_modules platforms package-lock.json && npm i && npx rimraf -- package-lock.json`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`nativescript-${options.name}`] = {
        "root": `apps/nativescript-${options.name}/`,
        "sourceRoot": `apps/nativescript-${options.name}/app`,
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
      projects[`nativescript-${options.name}`] = {
        tags: []
      };
      return updateNxProjects(tree, projects);
    }
  ]);
}

function addAppFiles(options: ApplicationOptions, appPath: string, extra: string = ''): Rule {
  extra = extra ? `${extra}_` : '';
  return branchAndMerge(
    mergeWith(apply(url(`./_${extra}files`), [
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
