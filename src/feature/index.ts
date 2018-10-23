import {
  apply,
  chain,
  url,
  move,
  template,
  mergeWith,
  TemplateOptions,
  Tree,
  SchematicContext,
  // SchematicsException,
  branchAndMerge,
  // schematic,
  Rule,
  noop
} from "@angular-devkit/schematics";
import {
  addGlobal,
  insert,
  addToCollection,
  stringUtils,
  supportedPlatforms,
  ITargetPlatforms,
  prerun,
  getPrefix,
  getNpmScope,
  platformAppPrefixError,
  generatorError,
  optionsMissingError,
  unsupportedPlatformError,
  formatFiles
} from "../utils";
import { Schema as featureOptions } from "./schema";
import * as ts from "typescript";

let featureName: string;
let projectNames: Array<string>;
export default function(options: featureOptions) {
  if (!options.name) {
    throw new Error(
      `You did not specify the name of the feature you'd like to generate. For example: ng g feature my-feature`
    );
  }
  if (options.routing && !options.onlyProject) {
    throw new Error(
      `When generating a feature with the --routing option, please also specify --onlyProject. Support for shared code routing is under development and will be available in the future.`
    );
  }
  featureName = options.name.toLowerCase();
  const projects = options.projects;
  let platforms = [];
  if (projects) {
    // building feature in shared code and in projects
    projectNames = projects.split(",");
    for (const name of projectNames) {
      const platPrefix = name.split("-")[0];
      if (
        supportedPlatforms.includes(platPrefix) &&
        !platforms.includes(platPrefix)
      ) {
        // if project name is prefixed with supported platform and not already added
        platforms.push(platPrefix);
      }
    }
  } else if (options.platforms) {
    // building feature in shared code only
    platforms = options.platforms.split(",");
  }
  if (platforms.length === 0) {
    let error = projects
      ? platformAppPrefixError()
      : generatorError('feature');
    throw new Error(optionsMissingError(error));
  }
  const targetPlatforms: ITargetPlatforms = {};
  for (const t of platforms) {
    if (supportedPlatforms.includes(t)) {
      targetPlatforms[t] = true;
    } else {
      throw new Error(unsupportedPlatformError(t));
    }
  }

  const projectChains = [];
  if (options.onlyProject) {
    for (const projectName of projectNames) {
      const platPrefix = projectName.split("-")[0];
      let srcDir = platPrefix !== "nativescript" ? "src/" : "";
      // check for 2 different naming conventions on routing modules
      const routingModulePathOptions = [];
      const routingModulePath = `apps/${projectName}/${srcDir}app/`;
      routingModulePathOptions.push(`${routingModulePath}app.routing.ts`);
      routingModulePathOptions.push(
        `${routingModulePath}app-routing.module.ts`
      );

      projectChains.push((tree: Tree, context: SchematicContext) => {
        return addFiles(options, platPrefix, projectName)(tree, context);
      });
      if (options.routing) {
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return adjustRouting(routingModulePathOptions, platPrefix)(
            tree,
            context
          );
        });
      }
      if (!options.onlyModule) {
        projectChains.push((tree: Tree, context: SchematicContext) => {
          return addFiles(options, platPrefix, projectName, "_component")(
            tree,
            context
          );
        });
      }
    }
  } else {
    projectChains.push(noop());
  }

  return chain([
    prerun(),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : addFiles(options)(tree, context),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject || options.ignoreBase || options.onlyModule
        ? noop()(tree, context)
        : addFiles(options, null, null, "_component")(tree, context),
    // update libs index
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : adjustBarrelIndex("libs/features/index.ts")(tree, context),
    // web
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && targetPlatforms.web
        ? addFiles(options, "web")(tree, context)
        : noop()(tree, context),
    // update web index
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && targetPlatforms.web
        ? adjustBarrelIndex("xplat/web/features/index.ts")(tree, context)
        : noop()(tree, context),
    // add starting component unless onlyModule
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && !options.onlyModule && targetPlatforms.web
        ? addFiles(options, "web", null, "_component")(tree, context)
        : noop()(tree, context),
    // nativescript
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && targetPlatforms.nativescript
        ? addFiles(options, "nativescript")(tree, context)
        : noop()(tree, context),
    // update nativescript index
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && targetPlatforms.nativescript
        ? adjustBarrelIndex("xplat/nativescript/features/index.ts")(
            tree,
            context
          )
        : noop()(tree, context),
    // add starting component unless onlyModule
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && !options.onlyModule && targetPlatforms.nativescript
        ? addFiles(options, "nativescript", null, "_component")(tree, context)
        : noop()(tree, context),
    // ionic
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && targetPlatforms.ionic
        ? addFiles(options, "ionic")(tree, context)
        : noop()(tree, context),
    // update ionic index
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && targetPlatforms.ionic
        ? adjustBarrelIndex("xplat/ionic/features/index.ts")(tree, context)
        : noop()(tree, context),
    // add starting component unless onlyModule
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && !options.onlyModule && targetPlatforms.ionic
        ? addFiles(options, "ionic", null, "_component")(tree, context)
        : noop()(tree, context),
    // project handling
    ...projectChains,
    options.skipFormat
      ? noop()
      : formatFiles(options)
  ]);
}

const addFiles = (
  options: featureOptions,
  target: string = "",
  projectName: string = "",
  extra: string = ""
) => {
  let moveTo: string;
  if (target) {
    moveTo = getMoveTo(target, projectName);
  } else {
    target = "lib";
    moveTo = `libs/features/${featureName}`;
  }
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${target}${extra}_files`), [
        template(getTemplateOptions(options)),
        move(moveTo)
      ])
    )
  );
};

function adjustBarrelIndex(indexFilePath: string): Rule {
  return (host: Tree) => {
    const indexSource = host.read(indexFilePath)!.toString("utf-8");
    const indexSourceFile = ts.createSourceFile(
      indexFilePath,
      indexSource,
      ts.ScriptTarget.Latest,
      true
    );

    insert(host, indexFilePath, [
      ...addGlobal(
        indexSourceFile,
        indexFilePath,
        `export * from './${featureName}';`,
        true
      )
    ]);
    return host;
  };
}

function getTemplateOptions(options: featureOptions) {
  return <TemplateOptions>{
    ...(options as any),
    name: featureName,
    npmScope: getNpmScope(),
    prefix: getPrefix(),
    dot: ".",
    utils: stringUtils
  };
}

function getMoveTo(platform: string, projectName?: string) {
  let moveTo = `xplat/${platform}/features/${featureName}`;
  if (projectName) {
    let srcDir = platform !== "nativescript" ? "src/" : "";
    moveTo = `apps/${projectName}/${srcDir}app/features/${featureName}`;
    // console.log('moveTo:', moveTo);
  }
  return moveTo;
}

function adjustRouting(
  routingModulePaths: Array<string>,
  platform: string
): Rule {
  return (host: Tree) => {
    let routingModulePath: string;
    // check which routing naming convention might be in use
    // app.routing.ts or app-routing.module.ts
    for (const modulePath of routingModulePaths) {
      if (host.exists(modulePath)) {
        routingModulePath = modulePath;
        break;
      }
    }
    // console.log('routingModulePath:',routingModulePath);
    // console.log('host.exists(routingModulePath):',host.exists(routingModulePath));
    if (routingModulePath) {
      const routingSource = host.read(routingModulePath)!.toString("utf-8");
      const routingSourceFile = ts.createSourceFile(
        routingModulePath,
        routingSource,
        ts.ScriptTarget.Latest,
        true
      );

      const changes = [];

      const loadPrefix = platform === "nativescript" ? "~" : ".";
      // add component to route config
      changes.push(
        ...addToCollection(
          routingSourceFile,
          routingModulePath,
          `{ 
              path: '${featureName}',
              loadChildren: '${loadPrefix}/features/${featureName}/${featureName}.module#${stringUtils.classify(
            featureName
          )}Module'
          }`
        )
      );

      insert(host, routingModulePath, changes);
    }
    return host;
  };
}
