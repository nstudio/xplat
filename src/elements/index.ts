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
  updateJsonInTree,
  missingArgument,
} from "../utils";
import { Schema as ElementsOptions } from "./schema";

let moduleName: string;
let customElementList: string;
let componentSymbols: Array<{ symbol: string; selector: string; }> = [];
let componentSymbolList: string;
export default function(options: ElementsOptions) {
  const example = `ng g elements menu --barrel=@mycompany/ui --components=menu,footer`;
  if (!options.name) {
    throw new SchematicsException(
      missingArgument('name', 'Provide a name for the custom element module.', example)
    );
  }
  if (!options.barrel) {
    throw new SchematicsException(
      missingArgument('barrel', 'Provide the name of the workspace barrel where your components live.', example)
    );
  }
  if (!options.components) {
    throw new SchematicsException(
      missingArgument('components', `Provide a comma delimited list of components you'd like to create as custom elements.`, example)
    );
  }
  moduleName = options.name;
  const workspacePrefix = getPrefix() || '';
  // parse component names to standard convention
  const componentNames = options.components.split(',');
  for (let component of componentNames) {
    // using short name ("menu" for a component named "MenuComponent")
    // convert to fully best practice name
    const isShortName = component.toLowerCase().indexOf('component') === -1;
    let selector = `${workspacePrefix ? `${workspacePrefix}-` : ''}`;
    if (isShortName) {
      selector += component.toLowerCase();
    } else {
      const parts = component.toLowerCase().split('component');
      selector += parts[0];
    }
    componentSymbols.push({
      selector,
      symbol: `${stringUtils.classify(component)}${isShortName ? 'Component' : ''}`
    });
  }
  componentSymbolList = componentSymbols.map(c => c.symbol).join(', ');

  customElementList = createCustomElementList(componentSymbols);

  return chain([
    prerun(options),
    // add custom element module
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
          customElementList,
          componentSymbolList,
          componentSymbols,
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

function createCustomElementList(componentSymbols) {
  const customElements = ['let component;'];
  for (const comp of componentSymbols) {
    customElements.push(`component = createCustomElement(${comp.symbol}, { injector });
    customElements.define('${comp.selector}', component);`);
  }
  return customElements.join('\n');
}