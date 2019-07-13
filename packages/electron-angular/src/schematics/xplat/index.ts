import {
  chain,
  externalSchematic
} from '@angular-devkit/schematics';
// import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { XplatHelpers, prerun } from '@nstudio/xplat';
import { XplatElectronAngularHelpers } from '../../utils';

export default function(options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    externalSchematic('@nstudio/electron', 'xplat', {
      ...options,
      skipDependentPlatformFiles: true
    }, { interactive: false}),
    externalSchematic('@nstudio/web-angular', 'xplat', options, { interactive: false}),
    XplatHelpers.addPlatformFiles(options, 'electron-angular'),
    XplatHelpers.updateTsConfigPaths(options, { framework: 'angular'}),
    XplatElectronAngularHelpers.updateRootDeps(options)
  ]);
}
