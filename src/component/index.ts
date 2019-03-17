import {
  apply,
  chain,
  url,
  move,
  template,
  mergeWith,
  Tree,
  SchematicContext,
  // SchematicsException,
  branchAndMerge,
  // schematic,
  // Rule,
  noop
} from "@angular-devkit/schematics";

import {
  stringUtils,
  supportedPlatforms,
  ITargetPlatforms,
  prerun,
  getPrefix,
  getNpmScope,
  addToFeature,
  adjustBarrelIndex,
  platformAppPrefixError,
  generatorError,
  generateOptionError,
  optionsMissingError,
  unsupportedPlatformError,
  needFeatureModuleError,
  formatFiles
} from "../utils";
import { Schema as featureOptions } from "./schema";

let featureName: string;
let projectNames: Array<string>;
let platforms: Array<string> = [];
export default function(options: featureOptions) {
  if (!options.name) {
    throw new Error(generateOptionError("component"));
  }

  // reset module globals
  options.needsIndex = false;
  projectNames = null;
  platforms = [];

  if (options.feature) {
    featureName = options.feature.toLowerCase();
  }
  const projects = options.projects;
  if (projects) {
    options.onlyProject = true;
    if (!featureName) {
      // no feature targeted, default to shared
      featureName = "shared";
    }
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
    if (!featureName) {
      // no feature targeted, default to ui
      featureName = "ui";
    }
    // building feature in shared code only
    platforms = options.platforms.split(",");
  }
  if (platforms.length === 0) {
    let error = projects
      ? platformAppPrefixError()
      : generatorError("component");
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
      const prefixPath = `apps/${projectName}/${srcDir}app`;
      const featurePath = `${prefixPath}/features/${featureName}`;
      const featureModulePath = `${featurePath}/${featureName}.module.ts`;
      const barrelIndex = `${featurePath}/components/index.ts`;
      // console.log('will adjustProject:', projectName);
      projectChains.push((tree: Tree, context: SchematicContext) => {
        if (!tree.exists(featureModulePath)) {
          throw new Error(
            needFeatureModuleError(
              featureModulePath,
              featureName,
              projectName,
              true
            )
          );
        }
        return addToFeature(
          "component",
          options,
          prefixPath,
          tree,
          `_${platPrefix}`
        )(tree, context);
      });
      projectChains.push((tree: Tree, context: SchematicContext) => {
        return adjustBarrelIndex("component", options, barrelIndex, true)(
          tree,
          context
        );
      });
      projectChains.push((tree: Tree, context: SchematicContext) => {
        return addToFeature("component", options, prefixPath, tree, "_index")(
          tree,
          context
        );
      });
    }
  } else {
    projectChains.push(noop());
  }

  const platformChains = [];
  for (const platform of supportedPlatforms) {
    if (targetPlatforms[platform]) {
      if (!options.onlyProject) {
        // add component
        platformChains.push((tree: Tree, context: SchematicContext) => {
          return addToFeature(
            "component",
            options,
            `xplat/${platform}`,
            tree,
            `_${platform}`,
            true
          )(tree, context);
        });
        if (options.subFolder) {
          // adjust components barrel for subFolder
          platformChains.push((tree: Tree, context: SchematicContext) => {
            return adjustBarrelIndex(
              "component",
              options,
              `xplat/${platform}/features/${featureName}/components/${
                options.subFolder
              }/index.ts`,
              true
            )(tree, context);
          });
          platformChains.push((tree: Tree, context: SchematicContext) => {
            return options.needsIndex
              ? addToFeature(
                  "component",
                  options,
                  `xplat/${platform}`,
                  tree,
                  "_index",
                  true
                )(tree, context)
              : noop()(tree, context);
          });
        }
        // adjust overall components barrel
        platformChains.push((tree: Tree, context: SchematicContext) => {
          return adjustBarrelIndex(
            "component",
            options,
            `xplat/${platform}/features/${featureName}/components/index.ts`,
            true,
            false,
            true
          )(tree, context);
        });

        platformChains.push((tree: Tree, context: SchematicContext) => {
          return options.needsIndex
            ? addToFeature(
                "component",
                options,
                `xplat/${platform}`,
                tree,
                "_index"
              )(tree, context)
            : noop()(tree, context);
        });
      }
    }
  }
  if (platformChains.length === 0) {
    // none specified, insert noop
    platformChains.push(noop());
  }

  return chain([
    prerun(),
    // add component for base libs feature
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && options.createBase
        ? addToFeature("component", options, "libs", tree, "_base", true)(
            tree,
            context
          )
        : noop()(tree, context),
    // adjust libs barrel for subFolder
    (tree: Tree, context: SchematicContext) =>
      options.subFolder && !options.onlyProject && options.createBase
        ? adjustBarrelIndex(
            "component",
            options,
            `libs/features/${featureName}/base/${options.subFolder}/index.ts`,
            false,
            true
          )(tree, context)
        : noop()(tree, context),
    // add index barrel if needed for subFolder
    (tree: Tree, context: SchematicContext) =>
      options.needsIndex
        ? addToFeature("component", options, "libs", tree, "_base_index", true)(
            tree,
            context
          )
        : noop()(tree, context),
    // adjust libs barrel
    (tree: Tree, context: SchematicContext) =>
      !options.onlyProject && options.createBase
        ? adjustBarrelIndex(
            "component",
            options,
            `libs/features/${featureName}/base/index.ts`,
            false,
            true
          )(tree, context)
        : noop()(tree, context),
    // add index barrel if needed
    (tree: Tree, context: SchematicContext) =>
      options.needsIndex
        ? addToFeature("component", options, "libs", tree, "_base_index")(
            tree,
            context
          )
        : noop()(tree, context),

    // add platform chains
    ...platformChains,
    // project handling
    ...projectChains,
    options.skipFormat ? noop() : formatFiles(options)
  ]);
}
