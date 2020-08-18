import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import { createOrUpdate } from '@nrwl/workspace';
import { getJsonFromFile, updateJsonFile } from '@nstudio/xplat-utils';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();
  // console.log('webpackConfig:',webpackConfig);
  const ngAppFactoryPath = join(
    cwd,
    'node_modules/@nstudio/schematics/src/app.nativescript/_files/app/app.module.ngfactory.d.ts'
  );
  // console.log('webpackConfigPath:', webpackConfigPath);
  const ngAppFactory = fs.readFileSync(ngAppFactoryPath, 'UTF-8');

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('nativescript-') === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      createOrUpdate(
        tree,
        `${appDir}/app/app.module.ngfactory.d.ts`,
        ngAppFactory
      );

      // update {N} app deps
      const packagePath = `${appDir}/package.json`;

      const packageJson = getJsonFromFile(tree, packagePath);

      if (packageJson) {
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          '@angular/compiler-cli':
            'file:../../node_modules/@angular/compiler-cli',
          '@angular/language-service':
            'file:../../node_modules/@angular/language-service',
          '@ngtools/webpack': '6.1.0-beta.1',
          'babel-traverse': '6.26.0',
          'babel-types': '6.26.0',
          babylon: '6.18.0',
          'clean-webpack-plugin': '~0.1.19',
          codelyzer: 'file:../../node_modules/codelyzer',
          'copy-webpack-plugin': '~4.5.1',
          'css-loader': '~0.28.11',
          'extract-text-webpack-plugin': '~3.0.2',
          lazy: '1.0.11',
          'nativescript-css-loader': '~0.26.0',
          'nativescript-dev-typescript': '~0.7.1',
          'nativescript-dev-webpack': '~0.14.1',
          'nativescript-worker-loader': '~0.9.0',
          'raw-loader': '~0.5.1',
          'resolve-url-loader': '~2.3.0',
          'sass-loader': '^7.0.2',
          'tns-platform-declarations':
            'file:../../node_modules/tns-platform-declarations',
          typescript: 'file:../../node_modules/typescript',
          'uglifyjs-webpack-plugin': '~1.2.5',
          webpack: '~4.12.0',
          'webpack-bundle-analyzer': '~2.13.0',
          'webpack-cli': '~3.0.7',
          'webpack-sources': '~1.1.0',
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

export default function (): Rule {
  return chain([updateNativeScriptApps]);
}
