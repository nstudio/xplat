import {
  Tree,
  SchematicContext,
  Rule,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move
} from '@angular-devkit/schematics';
import {
  updateTsConfig,
  IHelperSchema,
  IHelperConfig,
  getDefaultTemplateOptions
} from '@nstudio/xplat';

export const config: IHelperConfig = {
  addHelperFiles,
  additionalSupport: imports
};

function addHelperFiles(options: IHelperSchema): Rule {
  // executed from 'helpers' directory so ensure _files are loaded relative
  return branchAndMerge(
    mergeWith(
      apply(url(`./imports/_files`), [
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
    return tree;
  };
}
