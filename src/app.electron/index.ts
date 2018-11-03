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
  TemplateOptions,
  move
} from '@angular-devkit/schematics';
import { Schema as ApplicationOptions } from './schema';
import { prerun, getPrefix, getNpmScope, stringUtils, addRootDeps } from '../utils';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(`Missing name argument. Provide a name for your Electron app. Example: ng g app.electron sample`);
  }
  const appPath = `electron-${options.name}`;

  return chain([
    prerun(options.prefix),
    // create app files
    (tree: Tree, context: SchematicContext) => addAppFiles(options, appPath)(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, {electron: true}),
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