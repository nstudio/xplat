import { adjustSandbox, adjustRouting } from '@nstudio/angular';
import { chain, Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  XplatFeatureHelpers,
  PlatformTypes,
  XplatHelpers,
  prerun
} from '@nstudio/xplat';

export default function(options: XplatFeatureHelpers.Schema) {
  const featureSettings = XplatFeatureHelpers.prepare(options);
  const chains = [];

  if (options.onlyProject) {
    for (const projectName of featureSettings.projectNames) {
      const projectParts = projectName.split('-');
      const platPrefix = projectParts[0];
      const platSuffix = projectParts.pop();
      if (platPrefix === 'web' || platSuffix === 'web') {
        // check for 2 different naming conventions on routing modules
        const routingModulePathOptions = [];
        const appDirectory = `apps/${projectName}/src/app/`;
        routingModulePathOptions.push(`${appDirectory}app.routing.ts`);
        routingModulePathOptions.push(`${appDirectory}app-routing.module.ts`);

        chains.push((tree: Tree, context: SchematicContext) => {
          return XplatFeatureHelpers.addFiles(options, platPrefix, projectName)(
            tree,
            context
          );
        });
        if (options.routing) {
          chains.push((tree: Tree, context: SchematicContext) => {
            return adjustRouting(options, routingModulePathOptions, platPrefix)(
              tree,
              context
            );
          });
          if (options.adjustSandbox) {
            chains.push((tree: Tree, context: SchematicContext) => {
              return adjustSandbox(
                options,
                <PlatformTypes>platPrefix,
                appDirectory
              )(tree, context);
            });
          }
        }
        if (!options.onlyModule) {
          chains.push((tree: Tree, context: SchematicContext) => {
            return XplatFeatureHelpers.addFiles(
              options,
              platPrefix,
              projectName,
              '_component'
            )(tree, context);
          });
        }
      }
    }
  } else {
    // projectChains.push(noop());

    chains.push((tree: Tree, context: SchematicContext) =>
      XplatFeatureHelpers.addFiles(options, 'web', null, null, 'angular')(
        tree,
        context
      )
    );
    // update index
    chains.push((tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername('web', 'angular');
      return XplatFeatureHelpers.adjustBarrelIndex(
        options,
        `xplat/${xplatFolderName}/features/index.ts`
      )(tree, context);
    });
    // add starting component unless onlyModule
    if (!options.onlyModule) {
      chains.push((tree: Tree, context: SchematicContext) =>
        XplatFeatureHelpers.addFiles(
          options,
          'web',
          null,
          '_component',
          'angular'
        )(tree, context)
      );
    }
  }

  return chain([prerun(), ...chains]);
}
