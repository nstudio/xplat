import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from "@angular-devkit/schematics";
import { join } from 'path';
import * as fs from 'fs';

import { getJsonFromFile, updateJsonFile, createOrUpdate, updateJsonInTree } from '../../utils';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir("apps");
  const appFolders = appsDir.subdirs;
  const nxConfigPath = `nx.json`;
  const nxJson = getJsonFromFile(tree, nxConfigPath);
  const npmScope = nxJson.npmScope;
  const cwd = process.cwd();
  // console.log('webpackConfig:',webpackConfig);
  const mainPath = join(cwd, 'node_modules/@nstudio/schematics/src/app.nativescript/_files/app/main.ts');
  // console.log('webpackConfigPath:', webpackConfigPath);
  let mainFile = fs.readFileSync(mainPath, 'UTF-8');
  mainFile = mainFile.replace('<%= npmScope %>', npmScope);

  const hmrNavigationPath = join(cwd, 'node_modules/@nstudio/schematics/src/xplat/_nativescript_files/utils/livesync-navigation.ts');
  let hmrNavigation = fs.readFileSync(hmrNavigationPath, 'UTF-8');

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf("nativescript-") === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir); 

      createOrUpdate(
        tree,
        `${appDir}/app/main.ts`,
        mainFile
      );
    }
  }

  if (tree.exists('xplat/nativescript')) {
    createOrUpdate(
      tree,
      `xplat/nativescript/utils/livesync-navigation.ts`,
      hmrNavigation
    );

    const utilsTreePath = 'xplat/nativescript/utils/index.ts';
    const utilsFullPath = join(cwd, utilsTreePath);
    let utilsIndex;
    if (fs.existsSync(utilsFullPath)) {
      utilsIndex = fs.readFileSync(utilsFullPath, 'UTF-8');
      utilsIndex += `\nexport * from './livesync-navigation';`;
      createOrUpdate(
        tree,
        utilsTreePath,
        utilsIndex
      );
    }
  }
  return tree;
}

export default function(): Rule {
  return chain([updateNativeScriptApps]);
}
