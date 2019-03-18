import { Schema as ApplicationOptions } from "./schema";
import {
  SchematicsException,
  chain,
  Tree,
  SchematicContext,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
  Rule,
  noop,
  externalSchematic
} from "@angular-devkit/schematics";
import {
  stringUtils,
  getNpmScope,
  getPrefix,
  addRootDeps,
  getJsonFromFile,
  updatePackageScripts,
  addPostinstallers,
  formatFiles,
  updateNxProjects,
  prerun,
  applyAppNamingConvention,
  getAppName,
  updateJsonInTree,
  missingArgument,
  addInstall
} from "../utils";

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument('name', 'Provide a name for your Nest app.', 'ng g app.nest sample')
    );
  }

  const appPath = `nest-${options.name}`;

  return chain([
    prerun(options),
    // adjust naming convention
    applyAppNamingConvention(options, 'nest'),
    options.angularJson ? (tree: Tree) => updateAngularJson(options, tree) : noop(),
    // create app files
    (tree: Tree, context: SchematicContext) =>
      addAppFiles(options, appPath)(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, { nest: true }),
    // add npm scripts
    (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      const packageConfig = getJsonFromFile(tree, "package.json");
      const scripts = packageConfig.scripts || {};
      const tsConfig = `tsconfig${options.angularJson ? ".app" : ""}.json`;

      scripts[`serve.${platformApp}`] = `ts-node -P apps/${
        options.name
        }/${tsConfig} apps/${options.name}/src/main.ts`;
      scripts[`start.${platformApp}`] = `npm-run-all -p serve.${
        platformApp
        }`;
      scripts[`build.${platformApp}`] = `tsc -p apps/${
        options.name
        }/${tsConfig}`;
      scripts[`test.${platformApp}`] = `jest --config=apps/${
        options.name
        }/jest.json`;
      scripts[
        `test.${platformApp}.coverage`
      ] = `jest --config=apps/${
        options.name
        }/jest.json --coverage --coverageDirectory=coverage`;
      scripts[`test.${platformApp}.watch`] = `jest --config=apps/${
        options.name
        }/jest.json --watch`;
      scripts[`test.${platformApp}.e2e`] = `jest --config=apps/${
        options.name
        }/e2e/jest-e2e.json --forceExit`;
      scripts[
        `test.${platformApp}.e2e.watch`
      ] = `jest --config=apps/${options.name}/e2e/jest-e2e.json --watch`;

      return updatePackageScripts(tree, scripts);
    },
    // nx.json
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: []
      };
      return updateNxProjects(tree, projects);
    },
    addInstall,
    addPostinstallers(),
    options.skipFormat ? noop() : formatFiles(options)
  ]);
}

function addAppFiles(
  options: ApplicationOptions,
  appPath: string,
  sample: string = ""
): Rule {
  sample = "";
  const appname = getAppName(options, 'nest');
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${sample}files`), [
        template({
          ...(options as any),
          appname,
          utils: stringUtils,
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: ".",
          ext: options.angularJson ? ".app" : ""
        }),
        move(`apps/${appPath}`)
      ])
    )
  );
}

type AngularProject = { architect: { build: { options: { assets: any[] } }, test: {}, lint: { options: { tsConfig: string[] } } } }

/**
 * Remove assets option (not created), test target because it does not work
 * and spec tsConfig.
 * @todo fix the test target
 * @param nestProject Project configuration from angular.json
 */
function tweakNxNestArchitect(nestProject: AngularProject) {
  delete nestProject.architect.build.options.assets;
  delete nestProject.architect.test;
  nestProject.architect.lint.options.tsConfig.pop();

  return nestProject;
}

/**
 * Add Nest project to angular.json along with the architects targets
 * @param options 
 * @param host 
 */
function updateAngularJson(options: ApplicationOptions, host: Tree): Rule {
  let nestProject: AngularProject;

  return chain(
    [
      externalSchematic("@nrwl/schematics", "node-application", {
        ...options,
        skipInstall: true,
        skipFormat: true,
        skipPackageJson: true,
        framework: "nestjs"
      }),
      (tree: Tree) => {
        const nxAngular: { projects: {} } = JSON.parse(tree.read("/angular.json").toString());
        nestProject = tweakNxNestArchitect(nxAngular.projects[options.name]);
        return host;
      },
      updateJsonInTree("angular.json", angularJson => {
        angularJson.projects[options.name] = nestProject;
        return angularJson;
      })
    ]
  );
}
