import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';

import {
  getJsonFromFile,
  updateJsonFile,
  createOrUpdate,
  updateJsonInTree
} from '../../utils';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();
  const webpackConfigPath = join(
    cwd,
    'node_modules/@nstudio/schematics/src/app.nativescript/_files/webpack.config.js'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  const webpackConfig = fs.readFileSync(webpackConfigPath, 'UTF-8');
  // console.log('webpackConfig:',webpackConfig);
  const mainPath = join(
    cwd,
    'node_modules/@nstudio/schematics/src/app.nativescript/_files/app/main.ts'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  const mainFile = fs.readFileSync(mainPath, 'UTF-8');

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('nativescript-') === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      createOrUpdate(tree, `${appDir}/webpack.config.js`, webpackConfig);

      createOrUpdate(tree, `${appDir}/app/main.ts`, mainFile);

      // update {N} app deps
      const packagePath = `${appDir}/package.json`;

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular/compiler-cli': '~7.0.0',
          '@ngtools/webpack': '~7.0.0',
          'nativescript-dev-webpack': '~0.18.0'
        };

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }
    }
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.dependencies = {
      ...json.dependencies,
      '@ngx-translate/core': '~11.0.0',
      '@ngx-translate/http-loader': '~4.0.0',
      'nativescript-angular': '~7.0.0',
      'tns-core-modules': '~5.0.0'
    };
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      'tns-platform-declarations': '~5.0.0'
    };

    const appsDir = tree.getDir('apps');
    const appFolders = appsDir.subdirs;

    for (const dir of appFolders) {
      if (dir.indexOf('nativescript-') === 0) {
        const parts = dir.split('-');
        const appName = parts[1];
        json.scripts[
          `start.nativescript.${appName}.ios`
        ] = `cd apps/${dir} && tns run ios --emulator --bundle --hmr`;
        json.scripts[
          `start.nativescript.${appName}.android`
        ] = `cd apps/${dir} && tns run android --emulator --bundle --hmr`;
      }
    }

    return json;
  })(tree, context);
}

export default function(): Rule {
  return chain([updateNativeScriptApps, updateRootPackage]);
}
