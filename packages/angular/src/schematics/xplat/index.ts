import {
  chain,
  noop,
  Tree,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  move,
  template,
  SchematicContext
} from '@angular-devkit/schematics';
import { formatFiles } from '@nrwl/workspace';
import {
  prerun,
  XplatHelpers,
  addInstallTask,
  getDefaultTemplateOptions
} from '@nstudio/xplat';
import { XplatAngularHelpers } from '../../utils/xplat';

export default function(options: XplatHelpers.Schema) {
  // console.log(`Generating xplat angular support for: ${options.platforms}`);
  const externalChains = XplatAngularHelpers.externalChains(options);

  return chain([
    prerun(options, true),
    // update gitignore to support xplat
    XplatHelpers.updateGitIgnore(),
    // libs
    XplatAngularHelpers.addLibFiles(options),
    (tree: Tree, context: SchematicContext) => {
      if (tree.exists('/libs/scss/_index.scss')) {
        // user may have generated support already
        return noop()(tree, context);
      } else {
        return branchAndMerge(
          mergeWith(
            apply(url(`./_scss_files`), [
              template({
                ...(options as any),
                ...getDefaultTemplateOptions()
              }),
              move('libs/scss')
            ])
          )
        )(tree, context);
      }
    },
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
    addInstallTask(options)
  ]);
}
