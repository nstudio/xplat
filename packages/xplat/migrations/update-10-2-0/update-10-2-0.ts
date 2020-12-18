import {
  chain,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';

export default function (): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      return noop();
    },
  ]);
}
