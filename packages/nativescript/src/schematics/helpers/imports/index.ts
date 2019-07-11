import {
  Tree,
  SchematicContext,
  Rule,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
  SchematicsException,
  chain,
  noop
} from '@angular-devkit/schematics';
import {
  PlatformTypes,
  updateTsConfig,
  IHelperSchema,
  IHelperConfig,
  getPrefix,
  getNpmScope,
  missingArgument,
  unsupportedHelperError,
  prerun,
  buildHelperChain,
  getDefaultTemplateOptions
} from '@nstudio/xplat';
import { stringUtils } from '@nrwl/workspace';

export const config: IHelperConfig = {
  addHelperFiles: files,
  additionalSupport: imports
};

function files(options: IHelperSchema): Rule {
  return branchAndMerge(
    mergeWith(
      apply(url(`./_files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions()
        }),
        move(`xplat/nativescript/utils`)
      ])
    )
  );
}

function imports(helperChains: Array<any>, options: IHelperSchema) {
  return (tree: Tree, context: SchematicContext) => {
    let pathRef = `xplat/nativescript/utils/@nativescript/*`;
    // update root tsconfig
    helperChains.push(
      updateTsConfig(tree, (tsConfig: any) => {
        const updates: any = {};
        updates[`@nativescript/*`] = [pathRef];
        if (tsConfig) {
          if (!tsConfig.compilerOptions) {
            tsConfig.compilerOptions = {};
          }
          tsConfig.compilerOptions.paths = {
            ...(tsConfig.compilerOptions.paths || {}),
            ...updates
          };
        }
      })
    );

    // update all {N} app tsconfig's
    const appsDir = tree.getDir('apps');
    const appFolders = appsDir.subdirs;
    pathRef = `../../${pathRef}`;

    // update {N} apps and configs
    for (const dir of appFolders) {
      // console.log(dir);
      if (
        dir.indexOf('nativescript-') === 0 ||
        dir.indexOf('-nativescript') === 0
      ) {
        const appDir = `${appsDir.path}/${dir}`;
        // console.log('appDir:', appDir);

        helperChains.push(
          updateTsConfig(
            tree,
            (tsConfig: any) => {
              const updates: any = {};
              updates[`@nativescript/*`] = [pathRef];
              if (tsConfig) {
                if (!tsConfig.compilerOptions) {
                  tsConfig.compilerOptions = {};
                }
                tsConfig.compilerOptions.paths = {
                  ...(tsConfig.compilerOptions.paths || {}),
                  ...updates
                };
              }
            },
            null,
            `${appDir}/`
          )
        );
      }
    }
  };
}
