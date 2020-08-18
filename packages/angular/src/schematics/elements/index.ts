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
  noop,
} from '@angular-devkit/schematics';
import { updateJsonInTree, formatFiles } from '@nrwl/workspace';
import {
  stringUtils,
  updatePackageScripts,
  missingArgument,
  updateWorkspace,
  getDefaultTemplateOptions,
  XplatHelpers,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getJsonFromFile,
  updateJsonFile,
  supportedPlatforms,
  ITargetPlatforms,
} from '@nstudio/xplat-utils';

import { Schema as ElementsOptions } from './schema';

let customElementList: string;
let componentSymbols: Array<{ symbol: string; selector: string }>;
let componentSymbolList: string;
let htmlElements: string;
export default function (options: ElementsOptions) {
  if (!options.builderModule) {
    const example = `nx g @nstudio/angular:elements menu --barrel=@mycompany/ui --components=menu,footer`;
    if (!options.name) {
      throw new SchematicsException(
        missingArgument(
          'name',
          'Provide a name for the custom element module.',
          example
        )
      );
    }
    if (!options.barrel) {
      throw new SchematicsException(
        missingArgument(
          'barrel',
          'Provide the name of the workspace barrel where your components live.',
          example
        )
      );
    }
    if (!options.components) {
      throw new SchematicsException(
        missingArgument(
          'components',
          `Provide a comma delimited list of components you'd like to create as custom elements.`,
          example
        )
      );
    }
  }

  return chain([
    prerun(options),
    (tree: Tree) => {
      if (!options.builderModule) {
        const workspacePrefix = options.prefix || getPrefix() || '';
        const htmlElementList = [];
        componentSymbols = [];
        // parse component names to standard convention
        const componentNames = options.components.split(',');
        for (let component of componentNames) {
          // using short name ("menu" for a component named "MenuComponent")
          // convert to fully best practice name
          const isShortName =
            component.toLowerCase().indexOf('component') === -1;
          let selector = `${workspacePrefix ? `${workspacePrefix}-` : ''}`;
          if (isShortName) {
            selector += component.toLowerCase();
          } else {
            const parts = component.toLowerCase().split('component');
            selector += parts[0];
          }
          componentSymbols.push({
            selector,
            symbol: `${stringUtils.classify(component)}${
              isShortName ? 'Component' : ''
            }`,
          });
          htmlElementList.push(`<${selector}></${selector}>`);
        }
        componentSymbolList = componentSymbols.map((c) => c.symbol).join(', ');
        htmlElements = htmlElementList.join('\n');

        customElementList = createCustomElementList(componentSymbols);
      }
      return tree;
    },
    // add custom element module
    (tree: Tree, context: SchematicContext) => {
      return options.builderModule ? noop() : addFiles(options)(tree, context);
    },
    // add builder files or update them
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('xplat/web/elements/builder/index.html')) {
        return updateBuilder(tree, options);
      } else {
        return addFiles(options, 'builder')(tree, context);
      }
    },
    // adjust app files
    // (tree: Tree) => adjustAppFiles(options, tree),
    // add build scripts
    (tree: Tree) => {
      if (options.builderModule) {
        return noop();
      } else {
        const scripts = {};
        scripts[
          `build.web.elements`
        ] = `ng build web-elements --prod --output-hashing=none --single-bundle=true --keep-polyfills=true`;
        scripts[`preview.web.elements`] = `http-server dist/ngelements`;
        return updatePackageScripts(tree, scripts);
      }
    },
    (tree: Tree, context: SchematicContext) => {
      if (options.builderModule) {
        return noop()(tree, context);
      } else {
        return updateWorkspace({
          projects: {
            'web-elements': {
              root: '',
              sourceRoot: 'xplat/web/elements/builder',
              projectType: 'application',
              prefix: 'web-elements',
              schematics: {},
              architect: {
                build: {
                  builder: 'ngx-build-plus:build',
                  options: {
                    outputPath: 'dist/ngelements',
                    index: 'xplat/web/elements/builder/index.html',
                    main: 'xplat/web/elements/builder/elements.ts',
                    polyfills: 'xplat/web/elements/builder/polyfills.ts',
                    tsConfig:
                      'xplat/web/elements/builder/tsconfig.elements.json',
                  },
                  configurations: {
                    production: {
                      optimization: true,
                      outputHashing: 'all',
                      sourceMap: false,
                      extractCss: true,
                      namedChunks: false,
                      aot: true,
                      extractLicenses: true,
                      vendorChunk: false,
                      buildOptimizer: true,
                    },
                  },
                },
                serve: {
                  builder: 'ngx-build-plus:dev-server',
                  options: {
                    browserTarget: 'web-elements:build',
                  },
                  configurations: {
                    production: {
                      browserTarget: 'web-elements:build:production',
                    },
                  },
                },
              },
            },
          },
        })(tree, context);
      }
    },
    // update dependencies
    (tree: Tree, context: SchematicContext) => {
      return options.builderModule
        ? noop()
        : updateWorkspaceSupport(options, tree, context);
    },
    // update for builderModule if desired
    (tree: Tree, context: SchematicContext) => {
      if (options.builderModule) {
      } else {
        return noop();
      }
    },
    formatFiles({ skipFormat: options.skipFormat }),
  ]);
}

function addFiles(options: ElementsOptions, extra: string = ''): Rule {
  extra = extra ? `${extra}_` : '';
  const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions(),
          name: options.name.toLowerCase(),
          xplatFolderName,
          customElementList,
          componentSymbolList,
          componentSymbols,
          htmlElements,
        }),
        move(`xplat/${xplatFolderName}/elements`),
      ])
    )
  );
}

function updateWorkspaceSupport(
  options: ElementsOptions,
  tree: Tree,
  context: SchematicContext
) {
  return updateJsonInTree('package.json', (json) => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    const angularVersion = json.dependencies['@angular/core'];
    json.dependencies = {
      ...json.dependencies,
      '@angular/elements': angularVersion,
      '@webcomponents/webcomponentsjs': '^2.4.1',
    };
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      'http-server': '^0.12.1',
      'ngx-build-plus': '^9.0.6',
    };

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

function updateBuilder(tree: Tree, options: ElementsOptions) {
  if (options.builderModule) {
    tree.overwrite(
      `xplat/web/elements/builder/elements.ts`,
      builderElementsContent(options.builderModule)
    );
    const moduleFilePath = `xplat/web/elements/${options.builderModule}.module.ts`;
    if (tree.exists(moduleFilePath)) {
      const moduleFile = tree.get(moduleFilePath).content.toString();
      const selectorParts = moduleFile.split('.define(');
      selectorParts.splice(0, 1); // remove starting data
      const customElements = [];
      for (const part of selectorParts) {
        let selector = part.split(',')[0].replace(/'/gi, '').replace(/"/gi, '');
        customElements.push(`<${selector}></${selector}>`);
      }
      tree.overwrite(
        `xplat/web/elements/builder/index.html`,
        buildIndexContent(customElements.join('\n'))
      );
    } else {
      throw new SchematicsException(`${moduleFilePath} does not exist.`);
    }
  } else {
    tree.overwrite(
      `xplat/web/elements/builder/elements.ts`,
      builderElementsContent(options.name)
    );
    tree.overwrite(
      `xplat/web/elements/builder/index.html`,
      buildIndexContent(htmlElements)
    );
  }
  return tree;
}

function builderElementsContent(name: string) {
  return `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ${stringUtils.classify(name)}Module } from '../${name}.module';

platformBrowserDynamic()
  .bootstrapModule(${stringUtils.classify(name)}Module)
  .catch(err => console.log(err));
`;
}

function buildIndexContent(customElements: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Custom Elements</title>
  <base href="/">

  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  ${customElements}
</body>
</html>`;
}
