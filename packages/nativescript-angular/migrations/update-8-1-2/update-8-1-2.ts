import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import { updateJsonInTree, createOrUpdate } from '@nrwl/workspace';
import { getJsonFromFile, updateJsonFile, output } from '@nstudio/xplat';
import {
  nsNgVersion,
  nsCoreVersion,
  terserWebpackVersion
} from '../../src/utils/versions';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();
  const webpackConfigPath = join(
    cwd,
    'node_modules/@nstudio/nativescript-angular/src/schematics/application/_files/webpack.config.js'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  const webpackConfig = fs.readFileSync(webpackConfigPath, 'UTF-8');
  const srcPackagePath = join(
    cwd,
    'node_modules/@nstudio/nativescript-angular/src/schematics/application/_files/src/package.json'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  const srcPackage = fs.readFileSync(srcPackagePath, 'UTF-8');

  const appsNames = [];
  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (
      dir.indexOf('nativescript-') === 0 ||
      dir.indexOf('-nativescript') === 0
    ) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);
      appsNames.push(dir);

      createOrUpdate(tree, `${appDir}/webpack.config.js`, webpackConfig);
      createOrUpdate(tree, `${appDir}/src/package.json`, srcPackage);

      // update {N} app deps
      const packagePath = `${appDir}/package.json`;
      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular/compiler-cli': '~8.2.0',
          '@ngtools/webpack': '~8.3.0',
          'nativescript-dev-webpack': '~1.4.0'
        };

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }
    }
    output.log({
      title: 'Migration Note:',
      bodyLines: [
        `Please ensure you have the latest NativeScript cli installed: npm i -g nativescript`,
        `The following NativeScript apps have been updated to 6.3: ${appsNames}. The following files in those apps have been updated: webpack.config.js, src/package.json, and package.json. You may want to check the changeset to keep any customizations you may have made.`
      ]
    });
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.dependencies = {
      ...json.dependencies,
      'nativescript-angular': nsNgVersion,
      'tns-core-modules': nsCoreVersion
    };
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      'terser-webpack-plugin': terserWebpackVersion,
      'tns-platform-declarations': nsCoreVersion
    };

    return json;
  })(tree, context);
}

export default function(): Rule {
  return chain([updateNativeScriptApps, updateRootPackage]);
}
