import {
  apply,
  chain,
  url,
  move,
  template,
  mergeWith,
  Tree,
  SchematicContext,
  SchematicsException,
  branchAndMerge,
  schematic,
  noop
} from "@angular-devkit/schematics";
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

import {
  stringUtils,
  supportedPlatforms,
  ITargetPlatforms,
  prerun,
  getPrefix,
  getNpmScope,
  updateGitIgnore,
  addReferences,
  updatePackageForXplat,
  updatePackageScripts,
  updateIDESettings,
  getJsonFromFile,
  updateJsonFile,
  errorMissingPrefix,
  updateJsonInTree,
  unsupportedPlatformError,
  formatFiles,
  addTestingFiles,
  noPlatformError,
  sanitizeCommaDelimitedArg,
  hasWebPlatform
} from "../utils";
import { Schema as xPlatOptions } from "./schema";

let platformArg: string;
export default function(options: xPlatOptions) {
  const targetPlatforms: ITargetPlatforms = {};
  platformArg = options.platforms || '';
  if (platformArg === 'all') {
    // conveniently add support for all supported platforms
    for (const platform of supportedPlatforms) {
      targetPlatforms[platform] = true;
    }
    platformArg = supportedPlatforms.join(",");
  } else {
    const platforms = sanitizeCommaDelimitedArg(platformArg);
    if (platforms.length === 0) {
      throw new Error(noPlatformError());
    } else {
      for (const platform of platforms) {
        if (supportedPlatforms.includes(platform)) {
          targetPlatforms[platform] = true;
        } else {
          throw new Error(unsupportedPlatformError(platform));
        }
      }
    }
  }
  // console.log(`Generating xplat support for: ${platforms.toString()}`);
  const sample = options.sample;

  return chain([
    prerun(options, true),
    // update gitignore to support xplat
    updateGitIgnore(),
    // add references to support xplat
    addReferences(),
    // libs
    (tree: Tree, context: SchematicContext) =>
      addLibFiles(tree, options)(tree, context),
    // libs w/sample feature
    (tree: Tree, context: SchematicContext) =>
      sample
        ? addLibFiles(tree, options, "sample")(tree, context)
        : noop()(tree, context),
    // nativescript
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.nativescript
        ? addPlatformFiles(tree, options, "nativescript")(tree, context)
        : noop()(tree, context),
    // nativescript w/sample feature
    (tree: Tree, context: SchematicContext) =>
      sample
        ? addPlatformFiles(tree, options, "nativescript", "sample")(
            tree,
            context
          )
        : noop()(tree, context),
    // web
    (tree: Tree, context: SchematicContext) =>
      // always generate web if ionic or electron is specified since they depend on it
      hasWebPlatform(targetPlatforms)
        ? addPlatformFiles(tree, options, "web")(tree, context)
        : noop()(tree, context),
    // web w/sample feature
    (tree: Tree, context: SchematicContext) =>
      sample
        ? addPlatformFiles(tree, options, "web", "sample")(tree, context)
        : noop()(tree, context),
    // ionic
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.ionic
        ? addPlatformFiles(tree, options, "ionic")(tree, context)
        : noop()(tree, context),
    // electron 
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.electron
        ? addPlatformFiles(tree, options, "electron")(tree, context)
        : noop()(tree, context),
    // ssr (TODO)
    (tree: Tree, context: SchematicContext) =>
      targetPlatforms.ssr
        ? addPlatformFiles(tree, options, "ssr")(tree, context)
        : noop()(tree, context),
    // testing
    (tree: Tree, context: SchematicContext) =>
      addTestingFiles(tree, options)(tree, context),
    updateTestingConfig,
    updateLint,
    // update tsconfig files to support xplat
    (tree: Tree, context: SchematicContext) =>
      schematic("ts-config", {
        platforms: platformArg
      })(tree, context),
    formatFiles(options),
    // update root package for xplat configuration
    (tree: Tree) => updatePackageForXplat(tree, targetPlatforms),
    // clean shared code script ({N} build artifacts that may need to be cleaned up at times)
    (tree: Tree) => {
      const scripts = {};
      scripts[
        `clean.shared`
      ] = `cd libs/ && git clean -dfX && cd ../xplat/ && git clean -dfX`;
      return updatePackageScripts(tree, scripts);
    },
    // update IDE settings
    (tree: Tree) => updateIDESettings(tree, platformArg)
  ]);
}

const addPlatformFiles = (
  tree: Tree,
  options: xPlatOptions,
  platform: string,
  sample: string = ""
) => {
  if (!sample && tree.exists(`xplat/${platform}/core/index.ts`)) {
    return noop();
  }

  sample = sample ? `${sample}_` : "";
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${platform}_${sample}files`), [
        template({
          ...(options as any),
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: ".",
          utils: stringUtils
        }),
        move(`xplat/${platform}`)
      ])
    )
  );
};

const addLibFiles = (
  tree: Tree,
  options: xPlatOptions,
  sample: string = ""
) => {
  sample = sample ? `${sample}_` : "";

  if (!sample) {
    if (
      tree.exists(`libs/core/base/base-component.ts`) ||
      tree.exists(`libs/features/index.ts`)
    ) {
      return noop();
    }
  }

  return branchAndMerge(
    mergeWith(
      apply(url(`./_lib_${sample}files`), [
        template({
          ...(options as any),
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: ".",
          utils: stringUtils
        }),
        move("libs")
      ])
    )
  );
};

function updateTestingConfig(tree: Tree, context: SchematicContext) {
  const angularConfigPath = `angular.json`;
  const nxConfigPath = `nx.json`;

  const angularJson = getJsonFromFile(tree, angularConfigPath);
  const nxJson = getJsonFromFile(tree, nxConfigPath);
  const prefix = getPrefix();
  // console.log('prefix:', prefix);

  // update libs and xplat config
  if (angularJson && angularJson.projects) {
    angularJson.projects["libs"] = {
      root: "libs",
      sourceRoot: "libs",
      projectType: "library",
      prefix: prefix,
      architect: {
        test: {
          builder: "@angular-devkit/build-angular:karma",
          options: {
            main: "testing/test.libs.ts",
            tsConfig: "testing/tsconfig.libs.spec.json",
            karmaConfig: "testing/karma.conf.js"
          }
        },
        lint: {
          builder: "@angular-devkit/build-angular:tslint",
          options: {
            tsConfig: [
              "testing/tsconfig.libs.json",
              "testing/tsconfig.libs.spec.json"
            ],
            exclude: ["**/node_modules/**"]
          }
        }
      }
    };
    angularJson.projects["xplat"] = {
      root: "xplat",
      sourceRoot: "xplat",
      projectType: "library",
      prefix: prefix,
      architect: {
        test: {
          builder: "@angular-devkit/build-angular:karma",
          options: {
            main: "testing/test.xplat.ts",
            tsConfig: "testing/tsconfig.xplat.spec.json",
            karmaConfig: "testing/karma.conf.js"
          }
        },
        lint: {
          builder: "@angular-devkit/build-angular:tslint",
          options: {
            tsConfig: [
              "testing/tsconfig.xplat.json",
              "testing/tsconfig.xplat.spec.json"
            ],
            exclude: ["**/node_modules/**"]
          }
        }
      }
    };
  }

  if (nxJson && nxJson.projects) {
    nxJson.projects["libs"] = {
      tags: []
    };
    nxJson.projects["xplat"] = {
      tags: []
    };
  }

  tree = updateJsonFile(tree, angularConfigPath, angularJson);
  tree = updateJsonFile(tree, nxConfigPath, nxJson);
  return tree;
}

function updateLint(host: Tree, context: SchematicContext) {
  const prefix = getPrefix();

  return updateJsonInTree("tslint.json", json => {
    json.rules = json.rules || {};
    // remove forin rule as collides with LogService
    delete json.rules["forin"];
    // adjust console rules to work with LogService
    json.rules["no-console"] = [true, "debug", "time", "timeEnd", "trace"];
    json.rules["directive-selector"] = [true, "attribute", prefix, "camelCase"];
    json.rules["component-selector"] = [true, "element", prefix, "kebab-case"];

    return json;
  })(host, context);
}
