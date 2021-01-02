import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { prerun, supportedPlatforms } from '@nstudio/xplat-utils';
import { output } from '@nstudio/xplat';

export default function (): Rule {
  return chain([
    prerun(
      {
        framework: 'angular',
      },
      true
    ),
    // cleanup old dirs
    (tree: Tree, context: SchematicContext) => {
      try {
        let deleteXplatFolder = true;
        const nonSupportedPlatforms = [];
        const xplatDir = tree.getDir('xplat');
        if (xplatDir) {
          for (const platform of xplatDir.subdirs) {
            if (!supportedPlatforms.includes(<any>platform)) {
              nonSupportedPlatforms.push(platform);
              // user had manually created a non supported platform
              // ensure entire xplat folder is not deleted
              deleteXplatFolder = false;
            }
          }
        }

        if (deleteXplatFolder) {
          tree.delete('xplat');
        } else {
          // only delete supported platform folders
          for (const platform of supportedPlatforms) {
            tree.delete(`xplat/${platform}`);
          }
          if (nonSupportedPlatforms.length) {
            // note to user about the untouched custom folder
            output.log({
              title: `The following folders have been left alone. You may want to create a Nx library for them manually. The migration can only handle known supported platforms (${supportedPlatforms.join(
                ', '
              )}):`,
              bodyLines: nonSupportedPlatforms.map((p) => `xplat/${p}`),
            });
          }
        }
        tree.delete('testing');
        tree.delete('libs/core');
        tree.delete('libs/features');
        tree.delete('libs/scss');
        tree.delete('libs/utils');
      } catch (err) {}

      return tree;
    },
  ]);
}
