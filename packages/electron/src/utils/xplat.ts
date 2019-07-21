import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { XplatHelpers, getNpmScope } from '@nstudio/xplat';
import {
  waitOnVersion,
  npmRunAllVersion,
  electronUpdaterVersion,
  electronStoreVersion,
  electronReloadVersion,
  electronPackagerVersion,
  electronInstallerDmgVersion,
  electronRebuildVersion,
  electronBuilderVersion,
  electronVersion
} from './versions';

export namespace XplatElectrontHelpers {
  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      // dependencies[`@${getNpmScope()}/scss`] = 'file:libs/scss';
      // dependencies[`@${getNpmScope()}/web`] = 'file:xplat/web';
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies,
        devDependencies: {
          electron: electronVersion,
          'electron-builder': electronBuilderVersion,
          'electron-rebuild': electronRebuildVersion,
          'electron-installer-dmg': electronInstallerDmgVersion,
          'electron-packager': electronPackagerVersion,
          'electron-reload': electronReloadVersion,
          'electron-store': electronStoreVersion,
          'electron-updater': electronUpdaterVersion,
          'npm-run-all': npmRunAllVersion,
          'wait-on': waitOnVersion
        }
      })(tree, context);
    };
  }
}

/** May need these
 * if (targetPlatforms.electron) {
      // electron complains if this is missing
      dep = {
        name: '@angular/http',
        version: angularVersion,
        type: 'dependency'
      };
      deps.push(dep);

      dep = {
        name: 'npx',
        version: '10.2.0',
        type: 'devDependency'
      };
      deps.push(dep);
    }
 */
