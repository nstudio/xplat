import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { checkRootTsConfig } from '@nstudio/xplat-utils';

export default function (): Rule {
  return chain([
    (tree: Tree, context: SchematicContext) => {
      return checkRootTsConfig(tree);
    }
  ]);
}
