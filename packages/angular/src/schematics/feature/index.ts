import {
  chain,
  Tree,
  SchematicContext,
  SchematicsException,
  // schematic,
  Rule,
  noop,
  externalSchematic
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import {
  supportedPlatforms,
  prerun,
  unsupportedPlatformError,
  FeatureHelpers,
  getDefaultFramework
} from '@nstudio/xplat';

export default function(options: FeatureHelpers.Schema) {
  const featureSettings = FeatureHelpers.prepare(options);

  const externalChains = [];
  for (const platform of featureSettings.platforms) {
    if (supportedPlatforms.includes(platform)) {
      externalChains.push((tree: Tree, context: SchematicContext) => {
        //   console.log(`@nstudio/${platform}-angular`);
        // console.log('angular feature chain getDefaultFramework:', getDefaultFramework());
        return externalSchematic(
          `@nstudio/${platform}-angular`,
          'feature',
          options,
          {
            interactive: false
          }
        )(tree, context);
      });
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
        : FeatureHelpers.addFiles(options)(tree, context),
    // libs
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject || !options.createBase || options.onlyModule
        ? noop()(tree, context)
        : FeatureHelpers.addFiles(options, null, null, '_component')(
            tree,
            context
          ),
    // update libs index
    (tree: Tree, context: SchematicContext) =>
      options.onlyProject
        ? noop()(tree, context)
        : FeatureHelpers.adjustBarrelIndex(options, 'libs/features/index.ts')(
            tree,
            context
          ),
    // external schematic handling
    ...externalChains,
    formatFiles({ skipFormat: options.skipFormat })
  ]);
}
