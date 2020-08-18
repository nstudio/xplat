import { chain } from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatElectrontHelpers } from '../../utils';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    // TODO: add xplat files for vanilla electron
    // options.skipDependentPlatformFiles
    //   ? noop()
    //   : XplatHelpers.addPlatformFiles(options, 'electron'),
    // XplatHelpers.updateTsConfigPaths(options),
    XplatElectrontHelpers.updateRootDeps(options)
  ]);
}
