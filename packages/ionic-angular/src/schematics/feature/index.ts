import { chain, Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatFeatureHelpers, prerun } from '@nstudio/xplat';

export default function(options: XplatFeatureHelpers.Schema) {
  const xplatChains = [];
  xplatChains.push((tree: Tree, context: SchematicContext) =>
    XplatFeatureHelpers.addFiles(options, 'ionic', null, null, 'angular')(
      tree,
      context
    )
  );
  // update index
  xplatChains.push((tree: Tree, context: SchematicContext) =>
    XplatFeatureHelpers.adjustBarrelIndex(
      options,
      `xplat/ionic/features/index.ts`
    )(tree, context)
  );
  // add starting component unless onlyModule
  if (!options.onlyModule) {
    xplatChains.push((tree: Tree, context: SchematicContext) =>
      XplatFeatureHelpers.addFiles(
        options,
        'ionic',
        null,
        '_component',
        'angular'
      )(tree, context)
    );
  }

  return chain([prerun(), ...xplatChains]);
}
