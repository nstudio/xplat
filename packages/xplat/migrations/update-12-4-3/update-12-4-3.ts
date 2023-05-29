import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import { output } from '@nstudio/xplat';
import {
  getAppPaths,
  getJsonFromFile,
  getNpmScope,
  getPrefix,
  prerun,
  updateFile,
  updateJsonFile,
} from '@nstudio/xplat-utils';

const angularVersion = '^12.0.0';
const typescriptVersion = '~4.3.5';
const nsWebpackVersion = 'beta';
const ngxTranslateVersion = '~13.0.0';
const nsNgScopedVersion = '^12.0.0';
const nsCoreVersion = '~8.0.0';
const zoneJsVersion = '~0.11.1';
const rxjsVersion = '^6.6.0';

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

let hasNativeScriptApps = false;

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  const cwd = process.cwd();

  const nativeScriptAppsPaths = getAppPaths(tree, 'nativescript');
  const npmScope = getNpmScope();
  const appsNames = [];
  // update {N} apps and configs
  for (const dirPath of nativeScriptAppsPaths) {
    hasNativeScriptApps = true;
    appsNames.push(dirPath);
    // console.log(dir);
    // console.log('{N} appDir:', dirPath);
    const relativePath = dirPath
      .split('/')
      .filter((p) => !!p)
      .map((p) => '..')
      .join('/');
    const relativePathWindows = dirPath
      .split('/')
      .filter((p) => !!p)
      .map((p) => '..')
      .join('\\');

    const cwd = process.cwd();

    const webpackConfigPath = join(
      cwd,
      'node_modules/@nstudio/nativescript-angular/src/schematics/application/_files/webpack.config.js'
    );
    // console.log('webpackConfigPath:', webpackConfigPath);
    const webpackConfig = fs.readFileSync(webpackConfigPath, {
      encoding: 'utf-8',
    });
    updateFile(
      tree,
      `${dirPath}/webpack.config.js`,
      webpackConfig
        .replace(/<%= pathOffset %>/gi, relativePath + '/')
        .replace(/<%= npmScope %>/gi, npmScope)
    );

    // update {N} app deps
    const packagePath = `${dirPath}/package.json`;
    const packageJson = getJsonFromFile(tree, packagePath);

    if (packageJson) {
      packageJson.main = './src/main.ts';
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts = {
        ...packageJson.scripts,
        postinstall: 'node ./tools/xplat-postinstall.js',
      };
      packageJson.dependencies = packageJson.dependencies || {};
      packageJson.dependencies = {
        ...packageJson.dependencies,
        '@nativescript/core': '*',
      };
      delete packageJson.dependencies['@nativescript/angular'];
      delete packageJson.dependencies['nativescript-angular'];
      delete packageJson.dependencies['tns-core-modules'];
      delete packageJson.dependencies['@ngx-translate/core'];
      delete packageJson.dependencies['rxjs'];
      delete packageJson.dependencies['tslib'];
      delete packageJson.dependencies['reflect-metadata'];
      delete packageJson.dependencies['zone.js'];
      // clear out angular deps
      for (const key in packageJson.dependencies) {
        if (key.indexOf('@angular/') > -1) {
          delete packageJson.dependencies[key];
        }
        if (key.indexOf('@ngrx/') > -1) {
          delete packageJson.dependencies[key];
        }
        if (key.indexOf(`@${npmScope}/`) > -1) {
          delete packageJson.dependencies[key];
        }
      }

      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies = {
        '@nativescript/android': '8.0.0',
        '@nativescript/ios': '8.0.0',
      };

      // console.log('path:',path);
      // console.log('packageJson overwrite:', JSON.stringify(packageJson));
      tree = updateJsonFile(tree, packagePath, packageJson);
    }

    if (tree.exists(`${dirPath}/tsconfig.env.json`)) {
      tree.delete(`${dirPath}/tsconfig.env.json`);
    }
    if (tree.exists(`${dirPath}/tsconfig.tns.json`)) {
      tree.delete(`${dirPath}/tsconfig.tns.json`);
    }
    updateFile(
      tree,
      `${dirPath}/tools/xplat-postinstall.js`,
      `//#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');

// Copy potential hooks from root dependencies to app
const hooksSrc = '${relativePath}/hooks';
const hooksDest = 'hooks';
try {
  fs.copySync(hooksSrc, hooksDest);
} catch (err) {
  // ignore
}

// Helpful to trigger ngcc after an install to ensure all has processed properly
const child = childProcess.spawn(/^win/.test(process.platform) ? '${relativePathWindows}\\node_modules\\.bin\\ngcc' : '${relativePath}/node_modules/.bin/ngcc', ['--tsconfig', 'tsconfig.app.json', '--properties', 'es2015', 'module', 'main', '--first-only'], {
  cwd: process.cwd(),
  stdio: 'inherit',
});
child.on('close', (code) => {

});
      `
    );
    updateFile(
      tree,
      `${dirPath}/tsconfig.app.json`,
      `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "${relativePath}/dist/out-tsc",
    "types": []
  },
  "include": [
    "${relativePath}/libs/xplat/core/src/lib/environments/base/*.ts",
    "./src/environments/environment.*.ts"
  ],
  "files": [
    "./references.d.ts",
    "./src/main.ts",
    "./src/polyfills.ts"
  ]
}`
    );
    updateFile(
      tree,
      `${dirPath}/tsconfig.editor.json`,
      `{
  "extends": "./tsconfig.json",
  "include": ["**/*.ts"],
  "compilerOptions": {
    "types": ["jest", "node"]
  }
}
      `
    );
    updateFile(
      tree,
      `${dirPath}/tsconfig.json`,
      `{
  "extends": "${relativePath}/tsconfig.base.json",
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    },
    {
      "path": "./tsconfig.spec.json"
    },
    {
      "path": "./tsconfig.editor.json"
    }
  ]
}      
      `
    );
    updateFile(
      tree,
      `${dirPath}/tsconfig.spec.json`,
      `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "${relativePath}/dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "files": ["src/test-setup.ts"],
  "include": ["**/*.spec.ts", "**/*.d.ts"]
}      
      `
    );
    updateFile(
      tree,
      `${dirPath}/src/test-setup.ts`,
      `import 'jest-preset-angular';`
    );
    updateFile(
      tree,
      `${dirPath}/src/polyfills.ts`,
      `/**
* NativeScript Polyfills
*/

// Install @nativescript/core polyfills (XHR, setTimeout, requestAnimationFrame)
import '@nativescript/core/globals';
// Install @nativescript/angular specific polyfills
import '@nativescript/angular/polyfills';

/**
* Zone.js and patches
*/
// Add pre-zone.js patches needed for the NativeScript platform
import '@nativescript/zone-js/dist/pre-zone-polyfills';

// Zone JS is required by default for Angular itself
import 'zone.js';

// Add NativeScript specific Zone JS patches
import '@nativescript/zone-js';
       `
    );
    updateFile(
      tree,
      `${dirPath}/.eslintrc.json`,
      `{
  "extends": "${relativePath}/.eslintrc.json",
  "ignorePatterns": [
    "!**/*"
  ],
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "extends": [
        "plugin:@nx/nx/angular",
        "plugin:@angular-eslint/template/process-inline-templates"
      ],
      "parserOptions": {
        "project": [
          "${dirPath}/tsconfig.*?.json"
        ]
      },
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "${getPrefix()}",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "${getPrefix()}",
            "style": "kebab-case"
          }
        ]
      }
    },
    {
      "files": [
        "*.html"
      ],
      "extends": [
        "plugin:@nx/nx/angular-template"
      ],
      "rules": {}
    }
  ]
}
      `
    );
  }

  if (hasNativeScriptApps) {
    output.log({
      title: 'Migration Note:',
      bodyLines: [
        `Please ensure you have the latest NativeScript cli installed: npm i -g nativescript`,
        `The following NativeScript apps have been updated to 8: ${appsNames}.`,
        `Please note that you may still need to update some project imports. Build your app and work through any TypeScript errors one at a time to clear the remaining.`,
        `Be sure to check your git changeset to retain any changes to webpack.config.js or other files that were updated before committing. There may be some changes you want to keep that had been replaced in the update.`,
      ],
    });
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  const json = getJsonFromFile(tree, 'package.json');
  json.scripts = json.scripts || {};
  const nativeScriptDeps = {
    '@nativescript/angular': nsNgScopedVersion,
    '@nativescript/core': nsCoreVersion,
  };
  const nativeScriptDevDeps = {
    '@nativescript/types': nsCoreVersion,
    '@nativescript/webpack': nsWebpackVersion,
  };

  json.scripts.clean =
    'npx rimraf hooks node_modules package-lock.json && yarn config set ignore-engines true && yarn';
  json.dependencies = json.dependencies || {};
  json.dependencies = {
    ...json.dependencies,
    ...ngDeps,
    ...(hasNativeScriptApps ? nativeScriptDeps : {}),
    '@ngx-translate/core': ngxTranslateVersion,
    rxjs: rxjsVersion,
    'zone.js': zoneJsVersion,
  };
  delete json.dependencies['nativescript-angular'];
  delete json.dependencies['tns-core-modules'];
  delete json.devDependencies['tns-core-modules'];
  delete json.dependencies['tns-platform-declarations'];
  delete json.devDependencies['tns-platform-declarations'];
  json.devDependencies = json.devDependencies || {};
  json.devDependencies = {
    ...json.devDependencies,
    '@angular-devkit/architect': '^0.1200.0',
    '@angular-devkit/build-angular': angularVersion,
    '@angular-devkit/core': angularVersion,
    '@angular-devkit/schematics': angularVersion,
    '@angular/compiler-cli': angularVersion,
    '@angular/language-service': angularVersion,
    ...(hasNativeScriptApps ? nativeScriptDevDeps : {}),
    typescript: typescriptVersion,
  };
  return <any>updateJsonFile(tree, 'package.json', json);
}

export default function (): Rule {
  return chain([
    prerun(
      {
        framework: 'angular',
      },
      true
    ),
    updateNativeScriptApps,
    updateRootPackage,
  ]);
}
