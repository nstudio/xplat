import { adjustSandbox, adjustRouting } from '@nstudio/angular';
import {
  chain,
  Tree,
  SchematicContext,
  move,
  template,
  url,
  apply,
  branchAndMerge,
  mergeWith,
} from '@angular-devkit/schematics';
import { XplatFeatureHelpers, XplatHelpers } from '@nstudio/xplat';
import { prerun, PlatformTypes } from '@nstudio/xplat-utils';

export default function (options: XplatFeatureHelpers.Schema) {
  const featureSettings = XplatFeatureHelpers.prepare(options);
  const chains = [];

  if (options.onlyProject) {
    for (const projectName of featureSettings.projectNames) {
      let name = projectName;
      if (projectName.indexOf('/') > -1) {
        name = projectName.split('/').pop();
      }
      const projectParts = name.split('-');
      const platPrefix = projectParts[0];
      const platSuffix = projectParts.pop();
      if (platPrefix === 'nativescript' || platSuffix === 'nativescript') {
        // check for 2 different naming conventions on routing modules
        const routingModulePathOptions = [];
        const appDirectory = `apps/${projectName}/src/`;
        routingModulePathOptions.push(`${appDirectory}app.routing.ts`);
        routingModulePathOptions.push(`${appDirectory}app-routing.module.ts`);

        chains.push((tree: Tree, context: SchematicContext) => {
          return XplatFeatureHelpers.addFiles(
            options,
            platPrefix,
            projectName
          )(tree, context);
        });
        if (options.routing) {
          chains.push((tree: Tree, context: SchematicContext) => {
            return adjustRouting(
              options,
              routingModulePathOptions,
              platPrefix
            )(tree, context);
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
      XplatFeatureHelpers.addFiles(
        options,
        'nativescript',
        null,
        null,
        'angular'
      )
    );
    // update index
    chains.push((tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
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
          'nativescript',
          null,
          '_component',
          'angular'
        )
      );
    }
  }

  return chain([prerun(), ...chains]);
}

// (tree: Tree, context: SchematicContext) =>
//       !options.projects && targetPlatforms.nativescript
//         ? addToFeature(type, options, 'xplat/nativescript', tree)(tree, context)
//         : noop()(tree, context),
//     // adjust {N} barrel
//     (tree: Tree, context: SchematicContext) =>
//       !options.projects && targetPlatforms.nativescript
//         ? adjustBarrel(type, options, 'xplat/nativescript')(tree, context)
//         : noop()(tree, context),
//     // add index barrel if needed
//     (tree: Tree, context: SchematicContext) =>
//       options.needsIndex
//         ? addToFeature(type, options, 'xplat/nativescript', tree, '_index')(
//             tree,
//             context
//           )
//         : noop()(tree, context),
//     // adjust feature module metadata if needed
//     (tree: Tree, context: SchematicContext) =>
//       !options.projects && targetPlatforms.nativescript
//         ? adjustModule(tree, type, options, 'xplat/nativescript')(tree, context)
//         : noop()(tree, context),
