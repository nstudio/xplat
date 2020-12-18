import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { createOrUpdate } from '@nrwl/workspace';
import { getJsonFromFile, getAppPaths } from '@nstudio/xplat-utils';

export default function (): Rule {
  return chain([updateNativeScriptApps]);
}

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const nativeScriptAppsPaths = getAppPaths(tree, 'nativescript');

  // update {N} apps and configs
  for (const dirPath of nativeScriptAppsPaths) {
    // console.log(dir);
    // console.log('appDir:', appDir);
    const relativePath = dirPath
      .split('/')
      .filter((p) => !!p)
      .map((p) => '..')
      .join('/');

    createOrUpdate(
      tree,
      `${dirPath}/tsconfig.env.json`,
      `{
  "extends": "./tsconfig.json",
  "include": [
    "${relativePath}/libs/core/environments/*.ts"
  ]
}
`
    );
  }

  if (
    tree.exists('libs/core/environments/environment.ts') &&
    !tree.exists(`libs/core/environments/environment.prod.ts`)
  ) {
    createOrUpdate(
      tree,
      `libs/core/environments/environment.prod.ts`,
      `export const environment = {
  production: true
};`
    );
  }
  return tree;
}
