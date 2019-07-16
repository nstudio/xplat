import { chain, Tree, SchematicContext } from '@angular-devkit/schematics';
import { FeatureHelpers, prerun } from '@nstudio/xplat';

export default function(options: FeatureHelpers.Schema) {
  const xplatChains = [];
  xplatChains.push((tree: Tree, context: SchematicContext) =>
    FeatureHelpers.addFiles(options, 'ionic', null, null, 'angular')(
      tree,
      context
    )
  );
  // update index
  xplatChains.push((tree: Tree, context: SchematicContext) =>
    FeatureHelpers.adjustBarrelIndex(options, `xplat/ionic/features/index.ts`)(
      tree,
      context
    )
  );
  // add starting component unless onlyModule
  if (!options.onlyModule) {
    xplatChains.push((tree: Tree, context: SchematicContext) =>
      FeatureHelpers.addFiles(options, 'ionic', null, '_component', 'angular')(
        tree,
        context
      )
    );
  }

  return chain([prerun(), ...xplatChains]);
}
