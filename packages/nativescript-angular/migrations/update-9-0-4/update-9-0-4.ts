import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import { updateJsonInTree, createOrUpdate } from '@nrwl/workspace';
import { output } from '@nstudio/xplat';
import { getJsonFromFile, updateJsonFile } from '@nstudio/xplat-utils';
import {
  nsCoreVersion,
  nsNgScopedVersion,
  ngxTranslateVersion,
  nsWebpackVersion,
  typescriptVersion,
  angularVersion,
} from '../../src/utils/versions';

const ngDeps = {
  '@angular/animations': angularVersion,
  '@angular/common': angularVersion,
  '@angular/compiler': angularVersion,
  '@angular/core': angularVersion,
  '@angular/forms': angularVersion,
  '@angular/platform-browser': angularVersion,
  '@angular/platform-browser-dynamic': angularVersion,
  '@angular/router': angularVersion,
};

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();

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

      // update {N} app deps
      const packagePath = `${appDir}/package.json`;
      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...ngDeps,
          '@nativescript/angular': nsNgScopedVersion,
          '@nativescript/core': nsCoreVersion,
          '@ngx-translate/core': ngxTranslateVersion,
        };
        delete packageJson.dependencies['nativescript-angular'];
        delete packageJson.dependencies['tns-core-modules'];
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular/compiler-cli': angularVersion,
          '@ngtools/webpack': angularVersion,
          '@nativescript/types': nsCoreVersion,
          '@nativescript/webpack': nsWebpackVersion,
          typescript: typescriptVersion,
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
        `The following NativeScript apps have been updated to 9.0: ${appsNames}. The following files in those apps have been updated: webpack.config.js, src/package.json, ngcc.config.js and package.json. You may want to check the changeset to keep any customizations you may have made.`,
        `Please note that you may still need to update your project imports to @nativescript/angular instead of nativescript-angular.`,
      ],
    });
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return <any>updateJsonInTree('package.json', (json) => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.dependencies = {
      ...json.dependencies,
      ...ngDeps,
      '@nativescript/angular': nsNgScopedVersion,
      '@ngx-translate/core': ngxTranslateVersion,
    };
    delete json.dependencies['nativescript-angular'];
    delete json.dependencies['tns-core-modules'];
    json.devDependencies = json.devDependencies || {};

    return json;
  })(tree, <any>context);
}

export default function (): Rule {
  return chain([updateNativeScriptApps, updateRootPackage]);
}
