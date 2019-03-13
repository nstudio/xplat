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
  externalSchematic,
  noop
} from "@angular-devkit/schematics";

import {
  stringUtils,
  prerun,
  updatePackageScripts,
  getNpmScope,
  getPrefix,
  getJsonFromFile,
  applyAppNamingConvention,
  updateJsonFile,
  formatFiles,
  missingNameArgument,
  updateJsonInTree,
} from "../utils";
import { Schema as ElementsOptions } from "./schema";

let moduleName: string;
export default function(options: ElementsOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingNameArgument('Provide a name for the custom element module.', 'ng g elements menu')
    );
  }
  moduleName = options.name;

  return chain([
    prerun(options),
    // add element files
    (tree: Tree) => addFiles(options),
    // (tree: Tree, context: SchematicContext) =>
    //   options.sample || options.routing
    //   ? addAppFiles(options, options.sample ? "sample" : "routing")(tree, context)
    //   : noop()(tree, context),
    // adjust app files
    // (tree: Tree) => adjustAppFiles(options, tree),
    // add build scripts
    // (tree: Tree) => {
    //   const platformApp = options.name.replace('-', '.');
    //   const scripts = {};
    //   scripts[
    //     `clean`
    //   ] = `npx rimraf hooks node_modules package-lock.json && npm i`;
    //   scripts[`start.${platformApp}`] = `ng serve ${options.name}`;
    //   return updatePackageScripts(tree, scripts);
    // },
    // update dependencies
    (tree: Tree, context: SchematicContext) => {
      return updateWorkspaceSupport(options, tree, context);
    },
    // formatting
    options.skipFormat 
      ? noop()
      : formatFiles(options)
  ]);
}

function addFiles(options: ElementsOptions, extra: string = ""): Rule {
  extra = extra ? `${extra}_` : "";
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          name: options.name.toLowerCase(),
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: ".",
          utils: stringUtils
        }),
        move(`xplat/web/elements`)
      ])
    )
  );
}

function updateWorkspaceSupport(options: ElementsOptions, tree: Tree, context: SchematicContext) {
  return updateJsonInTree("package.json", json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    const angularVersion = json.dependencies['@angular/core'];
    json.dependencies = {
      ...json.dependencies,
      "@angular/elements": angularVersion,
      "@webcomponents/webcomponentsjs": "^2.2.7",
      "http-server": "^0.11.1",
      "ngx-build-plus": "^7.7.5"
    }
    // json.devDependencies = json.devDependencies || {};
    // json.devDependencies = {
    //   ...json.devDependencies,
    // }

    return json;
  })(tree, context);
}