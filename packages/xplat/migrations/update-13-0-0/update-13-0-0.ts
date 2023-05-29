import {
  chain,
  externalSchematic,
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

const angularVersion = '^12.2.0';
const nsWebpackVersion = '~5.0.0';
const ngxTranslateVersion = '~13.0.0';
const nsNgScopedVersion = '^12.2.0';
const nsCoreVersion = '~8.1.0';

let hasNativeScriptApps = false;

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
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

    // update {N} app deps
    const packagePath = `${dirPath}/package.json`;
    const packageJson = getJsonFromFile(tree, packagePath);

    if (packageJson) {
      packageJson.main = './src/main.ts';
      packageJson.scripts = packageJson.scripts || {};
      if (!packageJson.scripts.postinstall) {
        packageJson.scripts = {
          ...packageJson.scripts,
          postinstall: 'node ./tools/xplat-postinstall.js',
        };
      }
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
        '@nativescript/android': '~8.1.1',
        '@nativescript/ios': '~8.1.0',
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
console.info('Copying ' + hooksSrc + ' -> ' + hooksDest);
try {
  fs.copySync(hooksSrc, hooksDest);
} catch (err) {
  // ignore
}

// Helpful to trigger ngcc after an install to ensure all has processed properly
const ngccPath = require.resolve('@angular/compiler-cli/ngcc/main-ngcc.js');
const child = childProcess.spawn(
  ngccPath,
  [
    '--tsconfig',
    'tsconfig.app.json',
    '--properties',
    'es2015',
    'module',
    'main',
    '--first-only',
  ],
  {
    cwd: process.cwd(),
    shell: process.platform == 'win32',
  }
);
child.stdout.setEncoding('utf8');
child.stdout.on('data', function (data) {
  console.log(data);
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
      `import 'jest-preset-angular/setup-jest';`
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
        `The following NativeScript apps have been updated: ${appsNames}.`,
        `Please note that you may still need to update some project imports. Build your app and work through any TypeScript errors one at a time to clear the remaining.`,
        `Be sure to check your git changeset to retain any changes to other files that were updated before committing. There may be some changes you want to keep that had been replaced in the update.`,
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

  json.dependencies = json.dependencies || {};
  json.dependencies = {
    ...json.dependencies,
    ...(hasNativeScriptApps ? nativeScriptDeps : {}),
    '@ngx-translate/core': ngxTranslateVersion,
  };
  let ngToolsDeps = {
    '@ngtools/webpack': angularVersion,
  };
  if (json.dependencies['@angular/core']) {
    // make sure in sync with current angular versions
    ngToolsDeps['@ngtools/webpack'] = json.dependencies['@angular/core'];
  } else {
    ngToolsDeps = null;
  }
  delete json.dependencies['nativescript-angular'];
  delete json.dependencies['tns-core-modules'];
  delete json.devDependencies['tns-core-modules'];
  delete json.dependencies['tns-platform-declarations'];
  delete json.devDependencies['tns-platform-declarations'];
  json.devDependencies = json.devDependencies || {};
  json.devDependencies = {
    ...json.devDependencies,
    ...(hasNativeScriptApps ? nativeScriptDevDeps : {}),
    ...(ngToolsDeps ? ngToolsDeps : {}),
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
    (tree: Tree) => {
      return externalSchematic('@nx/workspace', 'convert-to-nx-project', {
        all: true,
      });
    },
  ]);
}
