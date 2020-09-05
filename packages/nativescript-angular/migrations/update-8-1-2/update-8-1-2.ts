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
} from '../../src/utils/versions';

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
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular/compiler-cli': '~8.2.0',
          '@ngtools/webpack': '~8.3.0',
          'nativescript-dev-webpack': '~1.4.0',
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
        `The following NativeScript apps have been updated to 6.3: ${appsNames}. The following files in those apps have been updated: webpack.config.js, src/package.json, and package.json. You may want to check the changeset to keep any customizations you may have made.`,
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
      '@nativescript/angular': nsNgScopedVersion,
      '@nativescript/core': nsCoreVersion,
    };
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      '@nativescript/types': nsCoreVersion,
    };

    return json;
  })(tree, <any>context);
}

export default function (): Rule {
  return chain([updateNativeScriptApps, updateRootPackage]);
}
