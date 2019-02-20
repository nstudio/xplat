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
  schematic,
  noop
} from "@angular-devkit/schematics";
import {
  stringUtils,
  prerun,
  getNpmScope,
  getPrefix,
  addRootDeps,
  updatePackageScripts,
  updateAngularProjects,
  updateNxProjects,
  applyAppNamingConvention,
  getGroupByName,
  getAppName,
  ITargetPlatforms,
  PlatformTypes,
  supportedPlatforms,
  unsupportedPlatformError,
  supportedHelpers,
  unsupportedHelperError,
  updateTsConfig
} from "../utils";
import { Schema as HelperOptions } from "./schema";

let helpers: Array<string> = [];
let platforms: Array<string> = [];
export default function(options: HelperOptions) {
  if (!options.name) {
    throw new SchematicsException(
      `Missing name argument. Provide a comma delimited list of helpers to generate. Example: ng g xplat-helper imports`
    );
  }
  if (!options.platforms) {
    throw new SchematicsException(
      `Missing platforms argument. Example: ng g xplat-helper imports --platforms=nativescript`
    );
  }

  helpers = options.name.split(",");
  platforms = options.platforms.split(",");

  const helperChains = [];

  for (const platform of platforms) {
    if (supportedPlatforms.includes(platform)) {
      for (const helper of helpers) {
        if (supportedHelpers.includes(helper)) {
          const moveTo = getMoveTo(<PlatformTypes>platform, helper);
          helperChains.push((tree: Tree, context: SchematicContext) => {
            return addHelperFiles(
              options,
              <PlatformTypes>platform,
              helper,
              moveTo
            )(tree, context);
          });
          // aside from adding files above, process any additional modifications
          helperChains.push((tree: Tree, context: SchematicContext) => {
            return processSupportingFiles(
              helperChains,
              options,
              <PlatformTypes>platform,
              helper
            );
          });
        } else {
          throw new SchematicsException(unsupportedHelperError(helper));
        }
      }
    } else {
      throw new SchematicsException(unsupportedPlatformError(platform));
    }
  }

  return chain([
    prerun(options),
    // add helper chains
    ...helperChains
    // TODO: add refactor code to update per the helper where applicable
  ]);
}

function addHelperFiles(
  options: HelperOptions,
  platform: PlatformTypes,
  helper: string,
  moveTo: string
): Rule {
  return branchAndMerge(
    mergeWith(
      apply(url(`./${platform}/${helper}/_files`), [
        template({
          ...(options as any),
          utils: stringUtils,
          npmScope: getNpmScope(),
          prefix: getPrefix(),
          dot: "."
        }),
        move(moveTo)
      ])
    )
  );
}

function getMoveTo(platform: PlatformTypes, helper: string) {
  let moveTo = `xplat/${platform}/utils`; // default
  // TODO: define custom moveTo locations for various helpers
  // switch (helper) {
  //   case "imports":
  //     break;
  // }
  return moveTo;
}

function processSupportingFiles(
  helperChains: Array<any>,
  options: HelperOptions,
  platform: PlatformTypes,
  helper: string
) {
  return (tree: Tree) => {
    switch (helper) {
      case "imports":
        switch (platform) {
          case "nativescript":
            let pathRef = `xplat/nativescript/utils/@nativescript/*`;
            // update root tsconfig
            helperChains.push(updateTsConfig(tree, (tsConfig: any) => {
              const updates: any = {};
              updates[`@nativescript/*`] = [
                pathRef
              ];
              if (tsConfig) {
                if (!tsConfig.compilerOptions) {
                  tsConfig.compilerOptions = {};
                }
                tsConfig.compilerOptions.paths = {
                  ...(tsConfig.compilerOptions.paths || {}),
                  ...updates
                };
              }
            }));

            // update all {N} app tsconfig's
            const appsDir = tree.getDir("apps");
            const appFolders = appsDir.subdirs;
            pathRef = `../../${pathRef}`;

            // update {N} apps and configs
            for (const dir of appFolders) {
              // console.log(dir);
              if (dir.indexOf('nativescript-') === 0 || dir.indexOf('-nativescript') === 0) {
                const appDir = `${appsDir.path}/${dir}`;
                // console.log('appDir:', appDir); 

                helperChains.push(updateTsConfig(tree, (tsConfig: any) => {
                  const updates: any = {};
                  updates[`@nativescript/*`] = [
                    pathRef
                  ];
                  if (tsConfig) {
                    if (!tsConfig.compilerOptions) {
                      tsConfig.compilerOptions = {};
                    }
                    tsConfig.compilerOptions.paths = {
                      ...(tsConfig.compilerOptions.paths || {}),
                      ...updates
                    };
                  }
                }, null, `${appDir}/`));
              }
            }
            break;
        }
        break;
    }
  };
}
