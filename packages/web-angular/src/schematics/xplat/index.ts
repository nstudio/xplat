import { chain, externalSchematic, noop } from '@angular-devkit/schematics';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatWebAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    externalSchematic('@nstudio/angular', 'xplat', options, { interactive: true}),
    options.skipDependentPlatformFiles
      ? noop()
      : XplatHelpers.addPlatformFiles(options, 'web-angular'),
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular' }),
    XplatWebAngularHelpers.updateRootDeps(options)
  ]);
}
