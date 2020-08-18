import { chain, noop } from '@angular-devkit/schematics';
import { XplatHelpers } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatNativeScriptHelpers } from '../../utils';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    options.skipDependentPlatformFiles
      ? noop()
      : XplatHelpers.addPlatformFiles(options, 'nativescript'),
    XplatNativeScriptHelpers.updateRootDeps(options),
    XplatNativeScriptHelpers.updatePrettierIgnore(),
  ]);
}
