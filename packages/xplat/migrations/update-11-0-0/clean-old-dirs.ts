import { chain, Rule, SchematicContext, Tree } from "@angular-devkit/schematics";
import { prerun } from "@nstudio/xplat-utils";

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
        // if (tree.exists('xplat')) {
          tree.delete('xplat');
        // }
        // if (tree.exists('testing')) {
          tree.delete('testing');
        // }
        // if (tree.exists('libs/core')) {
          tree.delete('libs/core');
        // }
        // if (tree.exists('libs/features')) {
          tree.delete('libs/features');
        // }
        // if (tree.exists('libs/scss')) {
          tree.delete('libs/scss');
        // }
        // if (tree.exists('libs/utils')) {
          tree.delete('libs/utils');
        // }
      } catch (err) {}

      return tree;
    },
  ]);
}
