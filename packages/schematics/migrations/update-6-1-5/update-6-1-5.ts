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
  createOrUpdate
} from '@nstudio/workspace';

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

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('nativescript-') === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      createOrUpdate(tree, `${appDir}/webpack.config.js`, webpackConfig);

      // update {N} app deps
      const packagePath = `${appDir}/package.json`;

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@ngtools/webpack': '6.1.0-beta.1',
          'clean-webpack-plugin': '~0.1.19',
          'copy-webpack-plugin': '~4.5.1',
          'css-loader': '~0.28.11',
          'extract-text-webpack-plugin': '~3.0.2',
          'nativescript-css-loader': '~0.26.0',
          'nativescript-dev-typescript': '~0.7.0',
          'nativescript-dev-webpack': '~0.13.0',
          'nativescript-worker-loader': '~0.9.0',
          'raw-loader': '~0.5.1',
          'resolve-url-loader': '~2.3.0',
          'sass-loader': '^7.0.2',
          'uglifyjs-webpack-plugin': '~1.2.5',
          webpack: '~4.12.0',
          'webpack-bundle-analyzer': '~2.13.0',
          'webpack-cli': '~3.0.7',
          'webpack-sources': '~1.1.0'
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
