import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import { updateJsonInTree, createOrUpdate } from '@nrwl/workspace';
import { getJsonFromFile, updateJsonFile } from '@nstudio/xplat-utils';

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', (json) => {
    json.dependencies = json.dependencies || {};
    if (json.dependencies['nativescript-angular']) {
      json.dependencies['nativescript-angular'] = '~6.1.0';
    }
    if (json.dependencies['tns-core-modules']) {
      json.dependencies['tns-core-modules'] = '~4.2.0';
    }
    if (json.dependencies['@ionic-native/core']) {
      json.dependencies['@ionic-native/core'] = '5.0.0-beta.14';
    }
    if (json.dependencies['@ionic-native/splash-screen']) {
      json.dependencies['@ionic-native/splash-screen'] = '5.0.0-beta.14';
    }
    if (json.dependencies['@ionic-native/status-bar']) {
      json.dependencies['@ionic-native/status-bar'] = '5.0.0-beta.14';
    }
    if (json.dependencies['@ionic/angular']) {
      json.dependencies['@ionic/angular'] = '~4.0.0-beta.1';
    }
    if (json.dependencies['@ionic/ng-toolkit']) {
      json.dependencies['@ionic/ng-toolkit'] = '~1.0.0';
    }
    if (json.dependencies['@ionic/schematics-angular']) {
      json.dependencies['@ionic/schematics-angular'] = '~1.0.0';
    }

    json.devDependencies = json.devDependencies || {};
    if (json.devDependencies['tns-platform-declarations']) {
      json.devDependencies['tns-platform-declarations'] = '~4.2.0';
    }

    return json;
  })(tree, context);
}

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();

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
          '@angular/compiler-cli': '~6.1.1',
          'nativescript-dev-webpack': '~0.15.0',
          '@ngtools/webpack': '~6.1.1',
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
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;

  // update Ionic apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('ionic-') === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      // update Ionic app deps
      const packagePath = `${appDir}/package.json`;

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies = {
          ...packageJson.dependencies,
          '@capacitor/android': '^1.0.0-beta.3',
          '@capacitor/cli': '^1.0.0-beta.3',
          '@capacitor/core': '^1.0.0-beta.3',
          '@capacitor/ios': '^1.0.0-beta.3',
        };
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular-devkit/architect': '0.7.2',
          '@angular-devkit/build-angular': '0.7.2',
          '@angular-devkit/core': '0.7.2',
          '@angular-devkit/schematics': '0.7.2',
        };

        // console.log('path:',path);
        // console.log('packageJson overwrite:', JSON.stringify(packageJson));
        tree = updateJsonFile(tree, packagePath, packageJson);
      }
    }
  }
  return tree;
}

export default function (): Rule {
  return chain([updateRootPackage, updateNativeScriptApps, updateIonicApps]);
}
