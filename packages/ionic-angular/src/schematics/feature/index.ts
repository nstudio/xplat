import { adjustSandbox, adjustRouting } from '@nstudio/angular';
import { chain, Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatFeatureHelpers, XplatHelpers } from '@nstudio/xplat';
import {
  prerun,
  PlatformTypes,
  parseProjectNameFromPath,
  supportedPlatforms,
} from '@nstudio/xplat-utils';

export default function (options: XplatFeatureHelpers.Schema) {
  const featureSettings = XplatFeatureHelpers.prepare(options);
  const chains = [];

  if (options.onlyProject) {
    for (const fullProjectPath of featureSettings.projectNames) {
      const projectName = parseProjectNameFromPath(fullProjectPath);
      const projectParts = projectName.split('-');

      const platPrefix = projectParts[0];
      const platSuffix = projectParts.pop();
      const platform = supportedPlatforms.includes(<PlatformTypes>platPrefix)
        ? platPrefix
        : platSuffix;
      if (platform === 'ionic') {
        // check for 2 different naming conventions on routing modules
        const routingModulePathOptions = [];
        const appDirectory = `apps/${fullProjectPath}/src/app/`;
        routingModulePathOptions.push(`${appDirectory}app.routing.ts`);
        routingModulePathOptions.push(`${appDirectory}app-routing.module.ts`);

        chains.push((tree: Tree, context: SchematicContext) => {
          return XplatFeatureHelpers.addFiles(
            options,
            platform,
            fullProjectPath
          )(tree, context);
        });
        if (options.routing) {
          chains.push((tree: Tree, context: SchematicContext) => {
            return adjustRouting(
              options,
              routingModulePathOptions,
              platform
            )(tree, context);
          });
          if (options.adjustSandbox) {
            chains.push((tree: Tree, context: SchematicContext) => {
              return adjustSandbox(
                options,
                <PlatformTypes>platform,
                appDirectory
              )(tree, context);
            });
          }
        }
        if (!options.onlyModule) {
          chains.push((tree: Tree, context: SchematicContext) => {
            return XplatFeatureHelpers.addFiles(
              options,
              platform,
              fullProjectPath,
              '_component'
            )(tree, context);
          });
        }
      }
    }
  } else {
    // projectChains.push(noop());

    chains.push((tree: Tree, context: SchematicContext) =>
      XplatFeatureHelpers.addFiles(
        options,
        'ionic',
        null,
        null,
        'angular'
      )(tree, context)
    );
    // update index
    chains.push((tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'ionic',
        'angular'
      );
      return XplatFeatureHelpers.adjustBarrelIndex(
        options,
        `libs/xplat/${xplatFolderName}/features/src/lib/index.ts`
      )(tree, context);
    });
    // add starting component unless onlyModule
    if (!options.onlyModule) {
      chains.push((tree: Tree, context: SchematicContext) =>
        XplatFeatureHelpers.addFiles(
          options,
          'ionic',
          null,
          '_component',
          'angular'
        )(tree, context)
      );
    }
  }

  return chain([prerun(), ...chains]);
}
