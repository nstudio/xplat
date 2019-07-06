import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';

import { updateJsonInTree } from '@nstudio/workspace';

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.devDependencies = json.devDependencies || {};

    const appsDir = tree.getDir('apps');
    const appFolders = appsDir.subdirs;

    for (const dir of appFolders) {
      if (dir.indexOf('nativescript-') === 0) {
        const parts = dir.split('-');
        parts.splice(0, 1); // remove {N}
        // join the rest since app name could have a dash as well
        const appName = parts.join('-');
        json.scripts[
          `start.nativescript.${appName}.ios`
        ] = `cd apps/${dir} && tns run ios --emulator --bundle`;
        json.scripts[
          `start.nativescript.${appName}.android`
        ] = `cd apps/${dir} && tns run android --emulator --bundle`;
        json.scripts[
          `clean.nativescript.${appName}`
        ] = `cd apps/${dir} && npx rimraf -- hooks node_modules platforms package-lock.json && npm i && npx rimraf -- package-lock.json`; // the final removal of package-lock.json fixes issue with node 10+
      }
    }

    return json;
  })(tree, context);
}

export default function(): Rule {
  return chain([updateRootPackage]);
}
