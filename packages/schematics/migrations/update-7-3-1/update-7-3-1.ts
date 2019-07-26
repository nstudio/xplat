import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import { updateJsonInTree, createOrUpdate } from '@nrwl/workspace';

function updateElectronApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();
  const tsConfigPath = join(
    cwd,
    'node_modules/@nstudio/schematics/src/app.electron/_files/tsconfig.json'
  );
  // console.log('tsConfigPath:', tsConfigPath);
  const tsConfig = fs.readFileSync(tsConfigPath, 'UTF-8');
  // console.log('tsConfig:',tsConfig);

  // update electron apps
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('electron-') === 0 || dir.indexOf('-electron') > -1) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      createOrUpdate(tree, `${appDir}/tsconfig.json`, tsConfig);
    }
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    const angularVersion = json.dependencies['@angular/core'];
    // electron dep check looks for @angular/http so adding to make sure not a problem
    json.dependencies = {
      ...json.dependencies,
      '@angular/http': angularVersion
    };
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      electron: '^4.0.5',
      'electron-builder': '^20.38.4',
      'electron-rebuild': '~1.8.4',
      'electron-installer-dmg': '~2.0.0',
      'electron-packager': '~13.1.0',
      'electron-reload': '~1.4.0',
      'electron-store': '~2.0.0',
      'electron-updater': '~4.0.6',
      'wait-on': '~3.2.0'
    };

    const appsDir = tree.getDir('apps');
    const appFolders = appsDir.subdirs;

    for (const dir of appFolders) {
      if (dir.indexOf('electron-') === 0 || dir.indexOf('-electron') > -1) {
        json.scripts[`postinstall`] = `electron-rebuild install-app-deps`;
      }
    }

    return json;
  })(tree, context);
}

export default function(): Rule {
  return chain([updateElectronApps, updateRootPackage]);
}
