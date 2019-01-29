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
  noop
} from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
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
  getAppName
} from "../utils";

export default function(options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      `Missing name argument. Provide a name for your Nest app. Example: ng g app.nest sample`
    );
  }

  const appPath = `nest-${options.name}`;

  return chain([
    prerun(options),
    // adjust naming convention
    applyAppNamingConvention(options, 'nest'),
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

      scripts[`serve.${platformApp}`] = `ts-node -P apps/${
        options.name
      }/tsconfig.json apps/${options.name}/src/main.ts`;
      scripts[`start.${platformApp}`] = `npm-run-all -p serve.${
        platformApp
      }`;
      scripts[`build.${platformApp}`] = `tsc -p apps/${
        options.name
      }`;
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

function addInstall(host: Tree, context: SchematicContext) {
  context.addTask(new NodePackageInstallTask());
  return host;
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
          dot: "."
        }),
        move(`apps/${appPath}`)
      ])
    )
  );
}
