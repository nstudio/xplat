import {
  chain,
  Tree,
  SchematicContext,
  SchematicsException,
  // schematic,
  Rule,
  noop,
  externalSchematic,
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import {
  unsupportedPlatformError,
  XplatFeatureHelpers,
  unsupportedPlatformErrorWithNxNote,
} from '@nstudio/xplat';
import {
  prerun,
  getNpmScope,
  getPrefix,
  getJsonFromFile,
  updateJsonFile,
  supportedPlatforms,
  ITargetPlatforms,
  getFrontendFramework,
  supportedNxExtraPlatforms,
  PlatformNxExtraTypes,
  PlatformTypes,
} from '@nstudio/xplat-utils';

export default function (options: XplatFeatureHelpers.Schema) {
  const featureSettings = XplatFeatureHelpers.prepare(options);

  const externalChains = [];
  for (const platform of featureSettings.platforms) {
    if (supportedPlatforms.includes(<PlatformTypes>platform)) {
      externalChains.push((tree: Tree, context: SchematicContext) => {
        //   console.log(`@nstudio/${platform}-angular`);
        // console.log('angular feature chain getFrontendFramework:', getFrontendFramework());
        return externalSchematic(
          `@nstudio/${platform}-angular`,
          'feature',
          options,
          {
            interactive: false,
          }
        )(tree, context);
      });
    } else if (
      supportedNxExtraPlatforms.includes(<PlatformNxExtraTypes>platform)
    ) {
      throw new SchematicsException(
        unsupportedPlatformErrorWithNxNote(platform, 'feature')
      );
    } else {
      throw new SchematicsException(unsupportedPlatformError(platform));
    }
  }

  return chain([
    prerun(),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : XplatFeatureHelpers.addFiles(options)(tree, context),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject || !options.createBase || options.onlyModule
        ? noop()(tree, context)
        : XplatFeatureHelpers.addFiles(
            options,
            null,
            null,
            '_component'
          )(tree, context),
    // update libs index
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : XplatFeatureHelpers.adjustBarrelIndex(
            options,
            'libs/xplat/features/src/lib/index.ts'
          )(tree, context),
    // external schematic handling
    ...externalChains,
    formatFiles({ skipFormat: options.skipFormat }),
  ]);
}
