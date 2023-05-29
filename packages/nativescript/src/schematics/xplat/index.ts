import { chain, noop } from '@angular-devkit/schematics';
import { XplatHelpers, convertNgTreeToDevKit } from '@nstudio/xplat';
import { prerun } from '@nstudio/xplat-utils';
import { XplatNativeScriptHelpers } from '../../utils';
import { initGenerator } from '@nx/js';

export default function (options: XplatHelpers.Schema) {
  return chain([
    prerun(options),
    async (tree, context) => {
      const nxTree = convertNgTreeToDevKit(tree, context);
      await initGenerator(nxTree, { skipFormat: true });
    },
    XplatHelpers.generateLib(options, 'scss', 'xplat/nativescript', 'node', ''),
    XplatHelpers.cleanupLib(options, 'scss', 'xplat/nativescript', ''),
    XplatHelpers.generateLib(
      options,
      'utils',
      'xplat/nativescript',
      'node',
      ''
    ),
    XplatHelpers.cleanupLib(options, 'utils', 'xplat/nativescript', ''),
    options.skipDependentPlatformFiles
      ? noop()
      : XplatHelpers.addPlatformFiles(
          options,
          'nativescript',
          'scss',
          '_common.scss'
        ),
    options.skipDependentPlatformFiles
      ? noop()
      : XplatHelpers.addPlatformFiles(
          options,
          'nativescript',
          'utils',
          'index.ts'
        ),
    XplatNativeScriptHelpers.updateRootDeps(options),
    XplatNativeScriptHelpers.updatePrettierIgnore(),
  ]);
}
