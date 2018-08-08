import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from "@angular-devkit/schematics";
import { join } from 'path';
import * as fs from 'fs';

import { getJsonFromFile, updateJsonFile, updateJsonInTree, createOrUpdate } from '../../utils';

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree("package.json", json => {
    json.dependencies = json.dependencies || {};
    json.dependencies['nativescript-angular'] = '~6.1.0';
    json.dependencies['tns-core-modules'] = '~4.2.0';
    json.devDependencies = json.devDependencies || {};
    json.devDependencies['tns-platform-declarations'] = '~4.2.0';
    return json;
  })(tree, context);
}

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir("apps");
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();
  const webpackConfigPath = join(cwd, 'node_modules/@nstudio/schematics/src/app.nativescript/_files/webpack.config.js');
  // console.log('webpackConfigPath:', webpackConfigPath);
  const webpackConfig = fs.readFileSync(webpackConfigPath, 'UTF-8');

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf("nativescript-") === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      createOrUpdate(
        tree,
        `${appDir}/webpack.config.js`,
        webpackConfig
      );

      // update {N} app deps
      const packagePath = `${appDir}/package.json`

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {

        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          "@angular/compiler-cli": "~6.1.1",
          "nativescript-dev-webpack": "~0.15.0",
          "@ngtools/webpack": "~6.1.1"
        };

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }
    }
  }
  return tree;
}

function updateIonicApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir("apps");
  const appFolders = appsDir.subdirs;

  // update Ionic apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf("ionic-") === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      // update Ionic app deps
      const packagePath = `${appDir}/package.json`

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {

        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          "@angular-devkit/architect": "0.7.2",
          "@angular-devkit/build-angular": "0.7.2",
          "@angular-devkit/core": "0.7.2",
          "@angular-devkit/schematics": "0.7.2"
        };

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }
    }
  }
  return tree;
}

export default function(): Rule {
  return chain([updateRootPackage, updateNativeScriptApps, updateIonicApps]);
}
