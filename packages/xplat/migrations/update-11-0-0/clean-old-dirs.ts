import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { prerun } from '@nstudio/xplat-utils';

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
        tree.delete('xplat');
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
