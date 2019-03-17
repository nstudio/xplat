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
  helperMissingPlatforms,
  supportedHelpers,
  unsupportedHelperError,
  updateTsConfig,
  helperTargetError,
  missingArgument,
} from "../utils";
import { Schema as HelperOptions } from "./schema";
// Helpers
import { supportApplitools_Web, applitools_logNote } from "./applitools";
import { supportImports_NativeScript } from "./imports";

// Configuration options for each helper
interface ISupportConfig {
  platforms: Array<string>;
  requiresTarget?: boolean;
  moveTo?: (platform: PlatformTypes, target?: string) => string;
  additionalSupport?: (
    platform: PlatformTypes,
    helperChains: Array<any>,
    options: HelperOptions
  ) => (tree: Tree, context: SchematicContext) => void;
}
interface IHelperSupportConfig {
  imports: ISupportConfig;
  applitools: ISupportConfig;
}
// Mapping config of what each helper supports
const helperSupportConfig: IHelperSupportConfig = {
  imports: {
    platforms: ["nativescript"],
    moveTo: function(platform: PlatformTypes, target?: string) {
      return `xplat/${platform}/utils`;
    },
    additionalSupport: function(
      platform: PlatformTypes,
      helperChains: Array<any>,
      options: HelperOptions
    ) {
      switch (platform) {
        case "nativescript":
          return supportImports_NativeScript(helperChains, options);
      }
    }
  },
  applitools: {
    platforms: ["web"],
    requiresTarget: true,
    additionalSupport: function(
      platform: PlatformTypes,
      helperChains: Array<any>,
      options: HelperOptions
    ) {
      switch (platform) {
        case "web":
          return supportApplitools_Web(helperChains, options);
      }
    }
  }
};
let helpers: Array<string> = [];
let platforms: Array<PlatformTypes> = [];
export default function(options: HelperOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument('name', 'Provide a comma delimited list of helpers to generate.', 'ng g xplat-helper imports')
    );
  }
  helpers = options.name.split(",");
  platforms = <Array<PlatformTypes>>(
    (options.platforms ? options.platforms.split(",") : [])
  );

  const helperChains = [];

  const processHelpers = (platform?: PlatformTypes) => {
    for (const helper of helpers) {
      if (supportedHelpers.includes(helper)) {
        // get helper support config
        const supportConfig: ISupportConfig = helperSupportConfig[helper];
        if (!platform) {
          // when using targeting the platforms argument can be ommitted
          // however when doing so it relies on platform being in the target name
          if (supportConfig.requiresTarget && options.target) {
            for (const p of supportedPlatforms) {
              const match = options.target.match(p);
              if (match) {
                platform = <PlatformTypes>match[0];
                break;
              }
            }
          }
        }
        // if platform is still falsey, error out
        if (!platform) {
          throw new SchematicsException(helperMissingPlatforms());
        }
        // throw is target required and it's missing
        if (supportConfig.requiresTarget && !options.target) {
          throw new SchematicsException(helperTargetError(helper));
        }

        if (supportConfig.platforms.includes(platform)) {
          if (supportConfig.moveTo) {
            // add files for the helper
            const moveTo = supportConfig.moveTo(platform, options.target);
            helperChains.push((tree: Tree, context: SchematicContext) => {
              return addHelperFiles(options, platform, helper, moveTo)(
                tree,
                context
              );
            });
          }

          if (supportConfig.additionalSupport) {
            // process additional support modifications
            helperChains.push((tree: Tree, context: SchematicContext) => {
              return supportConfig.additionalSupport(
                platform,
                helperChains,
                options
              )(tree, context);
            });
          }
        }
      } else {
        throw new SchematicsException(unsupportedHelperError(helper));
      }
    }
  };

  if (platforms.length) {
    for (const platform of platforms) {
      if (supportedPlatforms.includes(platform)) {
        processHelpers(platform);
      } else {
        throw new SchematicsException(unsupportedPlatformError(platform));
      }
    }
  } else {
    processHelpers();
  }

  return chain([
    prerun(options),
    // add helper chains
    ...helperChains,
    // log additional notes
    (tree: Tree) => {
      logNotes(options, helpers);
      return noop();
    }
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
      apply(url(`./${helper}/${platform}/_files`), [
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

function logNotes(options: HelperOptions, helpers: string[]) {
  for (const helper of helpers) {
    switch (helper) {
      case "applitools":
        applitools_logNote(options);
        break;
    }
  }
}
