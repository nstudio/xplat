import { chain, noop } from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import { prerun, XplatHelpers } from '@nstudio/xplat';
import { XplatAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  // console.log(`Generating xplat angular support for: ${platforms.toString()}`);
  const externalChains = XplatAngularHelpers.externalChains(options);

  return chain([
    prerun(options, true),
    // update gitignore to support xplat
    XplatHelpers.updateGitIgnore(),
    // libs
    XplatAngularHelpers.addLibFiles(options),
    // cross platform support
    ...externalChains,
    // testing
    XplatAngularHelpers.addTestingFiles(options, '_testing'),
    XplatAngularHelpers.updateTestingConfig(options),
    XplatAngularHelpers.updateLint(options),
    XplatAngularHelpers.updateRootDeps(options),
    formatFiles({ skipFormat: options.skipFormat }),
    // clean shared code script - don't believe need this anymore
    // (tree: Tree) => {
    //   const scripts = {};
    //   scripts[
    //     `clean.shared`
    //   ] = `cd libs/ && git clean -dfX && cd ../xplat/ && git clean -dfX`;
    //   return updatePackageScripts(tree, scripts);
    // },
    // update IDE settings
    XplatHelpers.updateIDESettings(options),
    options.skipInstall ? noop() : XplatHelpers.addPackageInstallTask(options)
  ]);
}
