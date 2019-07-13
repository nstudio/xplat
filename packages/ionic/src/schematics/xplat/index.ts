import { chain, externalSchematic, noop } from '@angular-devkit/schematics';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatIonicHelpers } from '../../utils';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    // TODO: add xplat files for vanilla ionic
    // options.skipDependentPlatformFiles
    //   ? noop()
    //   : XplatHelpers.addPlatformFiles(options, 'ionic'),
    // XplatHelpers.updateTsConfigPaths(options),
    XplatIonicHelpers.updateRootDeps(options)
  ]);
}
