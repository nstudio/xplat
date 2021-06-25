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
  electronBuilderVersion,
  electronInstallerDmgVersion,
  electronPackagerVersion,
  electronRebuildVersion,
  electronReloadVersion,
  electronStoreVersion,
  electronUpdaterVersion,
  electronVersion,
  npmRunAllVersion,
  waitOnVersion,
} from '@nstudio/electron';

function updateElectronApps(tree: Tree, context: SchematicContext) {
  const nxConfigPath = `nx.json`;
  const nxJson = getJsonFromFile(tree, nxConfigPath);
  const npmScope = nxJson.npmScope;

  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();
  const indexPath = join(
    cwd,
    'node_modules/@nstudio/electron-angular/src/schematics/application/_files/src/index.ts__tmpl__'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  const indexContent = fs.readFileSync(indexPath, { encoding: 'utf-8' });
  const servicePath = join(
    cwd,
    'node_modules/@nstudio/electron-angular/src/schematics/xplat/_files/core/services/electron.service.ts__tmpl__'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  let electronService = fs.readFileSync(servicePath, { encoding: 'utf-8' });
  electronService = electronService.replace(/<%= npmScope %>/gi, npmScope);

  const appsNames = [];
  // update electron apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (
      dir.indexOf('nativescript-') === 0 ||
      dir.indexOf('-nativescript') === 0
    ) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);
      appsNames.push(dir);

      createOrUpdate(tree, `${appDir}/src/index.ts`, indexContent);
      createOrUpdate(
        tree,
        `xplat/electron/core/services/electron.service.ts`,
        electronService
      );
    }
    output.log({
      title: 'Migration Note:',
      bodyLines: [
        `The following Electron apps have been updated to 7: ${appsNames}.`,
      ],
    });
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', (json) => {
    json.devDependencies = json.devDependencies || {};
    json.devDependencies = {
      ...json.devDependencies,
      electron: electronVersion,
      'electron-builder': electronBuilderVersion,
      'electron-rebuild': electronRebuildVersion,
      'electron-installer-dmg': electronInstallerDmgVersion,
      'electron-packager': electronPackagerVersion,
      'electron-reload': electronReloadVersion,
      'electron-store': electronStoreVersion,
      'electron-updater': electronUpdaterVersion,
      'npm-run-all': npmRunAllVersion,
      'wait-on': waitOnVersion,
    };

    return json;
  })(tree, <any>context);
}

export default function (): Rule {
  return chain([updateElectronApps, <any>updateRootPackage]);
}
