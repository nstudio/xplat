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
  updateAngularProjects,
} from "../utils";
import { Schema as ElementsOptions } from "./schema";

let moduleName: string;
let customElementList: string;
let componentSymbols: Array<{ symbol: string; selector: string; }> = [];
let componentSymbolList: string;
let htmlElements: string;
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

  return chain([
    prerun(options),
    (tree: Tree) => {
      const workspacePrefix = options.prefix || getPrefix() || '';
      const htmlElementList = [];
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
        htmlElementList.push(`<${selector}></${selector}>`);
      }
      componentSymbolList = componentSymbols.map(c => c.symbol).join(', ');
      htmlElements = htmlElementList.join('\n');

      customElementList = createCustomElementList(componentSymbols);
      return tree;
    },
    // add custom element module
    (tree: Tree) => addFiles(options),
    // adjust app files
    // (tree: Tree) => adjustAppFiles(options, tree),
    // add build scripts
    (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      const scripts = {};
      scripts[
        `build.web.elements`
      ] = `ng build web-elements --prod --output-hashing=none --single-bundle=true --keep-polyfills=true`;
      return updatePackageScripts(tree, scripts);
    },
    (tree: Tree) => {
      const projects = {};
      projects[`web-elements`] = {
        "root": "",
        "sourceRoot": "xplat/web/elements/builder",
        "projectType": "application",
        "prefix": "web-elements",
        "schematics": {},
        "architect": {
          "build": {
            "builder": "ngx-build-plus:build",
            "options": {
              "outputPath": "dist/ngelements",
              "index": "xplat/web/elements/builder/index.html",
              "main": "xplat/web/elements/builder/elements.ts",
              "polyfills": "xplat/web/elements/builder/polyfills.ts",
              "tsConfig": "xplat/web/elements/builder/tsconfig.elements.json"
            },
            "configurations": {
              "production": {
                "optimization": true,
                "outputHashing": "all",
                "sourceMap": false,
                "extractCss": true,
                "namedChunks": false,
                "aot": true,
                "extractLicenses": true,
                "vendorChunk": false,
                "buildOptimizer": true
              }
            }
          },
          "serve": {
            "builder": "ngx-build-plus:dev-server",
            "options": {
              "browserTarget": "web-elements:build"
            },
            "configurations": {
              "production": {
                "browserTarget": "web-elements:build:production"
              }
            }
          }
        }
      };
      return updateAngularProjects(tree, projects);
    },
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
          htmlElements,
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
      "@webcomponents/webcomponentsjs": "^2.2.7"
    }
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      "http-server": "^0.11.1",
      "ngx-build-plus": "^7.7.5"
    }

    return json;
  })(tree, context);
}

function createCustomElementList(componentSymbols) {
  const customElements = ['let component;'];
  for (const comp of componentSymbols) {
    customElements.push(`component = createCustomElement(${comp.symbol}, { injector: this.injector });
    customElements.define('${comp.selector}', component);`);
  }
  return customElements.join('\n');
}