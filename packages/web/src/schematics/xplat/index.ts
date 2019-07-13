import { chain, externalSchematic } from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatWebHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    XplatHelpers.addPlatformFiles(options, 'web'),
    XplatHelpers.updateTsConfigPaths(options),
    XplatWebHelpers.updateRootDeps(options)
  ]);
}
