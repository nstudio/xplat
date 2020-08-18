import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';

import { getJsonFromFile, updateJsonFile } from '@nstudio/xplat-utils';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('nativescript-') === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      // update {N} app deps
      const packagePath = `${appDir}/package.json`;

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular/compiler-cli': '6.1.0-rc.0',
          '@ngtools/webpack': '6.1.0-rc.0'
        };
        // ensure dev sass is removed
        delete packageJson.devDependencies['nativescript-dev-sass'];

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }
    }
  }
  return tree;
}

export default function(): Rule {
  return chain([updateNativeScriptApps]);
}
