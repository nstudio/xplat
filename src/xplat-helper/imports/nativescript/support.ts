import {
  Tree, SchematicContext,
} from "@angular-devkit/schematics";
import {
  updateTsConfig
} from "../../../utils";
import { Schema as HelperOptions } from "../../schema";

export function supportImports_NativeScript(
  helperChains: Array<any>,
  options: HelperOptions
) {
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
    const appsDir = tree.getDir("apps");
    const appFolders = appsDir.subdirs;
    pathRef = `../../${pathRef}`;

    // update {N} apps and configs
    for (const dir of appFolders) {
      // console.log(dir);
      if (
        dir.indexOf("nativescript-") === 0 ||
        dir.indexOf("-nativescript") === 0
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
