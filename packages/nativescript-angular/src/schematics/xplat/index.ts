import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import {
  prerun,
} from '@nstudio/xplat-utils';
import { XplatAngularHelpers } from '@nstudio/angular';
import { XplatNativeScriptAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options, true),
    XplatNativeScriptAngularHelpers.addReferences(),
    (tree: Tree, context: SchematicContext) =>
      externalSchematic(
        '@nstudio/nativescript',
        'xplat',
        {
          ...options,
          skipDependentPlatformFiles: true
        },
        { interactive: false }
      ),
    (tree: Tree, context: SchematicContext) => {
      const xplatFolderName = XplatHelpers.getXplatFoldername(
        'nativescript',
        'angular'
      );
      // console.log('xplatName:', xplatName);
      // console.log('options:', options);
      return options.skipDependentPlatformFiles
        ? noop()
        : XplatHelpers.addPlatformFiles(options, xplatFolderName)(
            tree,
            context
          );
    },
    // TODO: convert these @nstudio/angular api's to singular external schematics so could be called with externalSchematic api
    XplatAngularHelpers.addLibFiles(
      options,
      `../../../../angular/src/schematics/xplat/`
    ),
    XplatAngularHelpers.addScssFiles(
      options,
      `../../../../angular/src/schematics/xplat/`
    ),
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatNativeScriptAngularHelpers.updateRootDeps(options)
  ]);
}
