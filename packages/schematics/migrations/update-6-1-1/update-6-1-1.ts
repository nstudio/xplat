import {
  chain,
  Rule,
  SchematicContext,
  Tree
} from '@angular-devkit/schematics';
import { updateJsonInTree, createOrUpdate } from '@nrwl/workspace';
import { getJsonFromFile } from '@nstudio/xplat';

function updateNativeScriptApps(tree: Tree, context: SchematicContext) {
  const nxConfigPath = `nx.json`;

  const nxJson = getJsonFromFile(tree, nxConfigPath);

  const npmScope = nxJson.npmScope;
  const appsDir = tree.getDir('apps');
  const appFolders = appsDir.subdirs;
  // console.log("npmScope:", npmScope);
  // console.log("prefix:", prefix);

  // update {N} apps and configs
  for (const dir of appFolders) {
    // console.log(dir);
    if (dir.indexOf('nativescript-') === 0) {
      const appDir = `${appsDir.path}/${dir}`;
      // console.log('appDir:', appDir);

      createOrUpdate(tree, `${appDir}/tsconfig.esm.json`, getTsConfigESM());
      createOrUpdate(tree, `${appDir}/tsconfig.json`, getTsConfig(npmScope));
    }
  }
  return tree;
}

function updateRootPackage(tree: Tree, context: SchematicContext) {
  return updateJsonInTree('package.json', json => {
    json.scripts = json.scripts || {};
    json.dependencies = json.dependencies || {};
    json.devDependencies = json.devDependencies || {};

    const appsDir = tree.getDir('apps');
    const appFolders = appsDir.subdirs;

    for (const dir of appFolders) {
      if (dir.indexOf('nativescript-') === 0) {
        const parts = dir.split('-');
        const appName = parts[1];
        json.scripts[
          `start.nativescript.${appName}.ios`
        ] = `cd apps/${dir} && tns run ios --emulator --bundle`;
        json.scripts[
          `start.nativescript.${appName}.android`
        ] = `cd apps/${dir} && tns run android --emulator --bundle`;
        json.scripts[
          `clean.nativescript.${appName}`
        ] = `cd apps/${dir} && npx rimraf -- hooks node_modules platforms package-lock.json && npm i && npx rimraf -- package-lock.json`; // the final removal of package-lock.json fixes issue with node 10+
      }
    }

    return json;
  })(tree, context);
}

export default function(): Rule {
  return chain([updateNativeScriptApps, updateRootPackage]);
}

function getTsConfig(npmScope) {
  return `{
    "compilerOptions": {
        "module": "commonjs",
        "target": "es2015",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "noEmitHelpers": true,
        "noEmitOnError": true,
        "removeComments": true,
        "skipLibCheck": true,
        "lib": [
            "es2017",
            "dom",
            "es6"
        ],
        "baseUrl": ".",
        "paths": {
            "~/*": [
                "app/*"
            ],
            "@${npmScope}/*": [
                "../../libs/*"
            ],
            "@${npmScope}/nativescript": [
                "../../xplat/nativescript/index.ts"
            ],
            "@${npmScope}/nativescript/*": [
                "../../xplat/nativescript/*"
            ],
            "*": [
                "./node_modules/tns-core-modules/*",
                "./node_modules/*"
            ]
        }
    },
    "exclude": [
        "node_modules",
        "platforms"
    ]
}
    `;
}

function getTsConfigESM() {
  return `{
      "extends": "./tsconfig",
      "compilerOptions": {
          "module": "es2015",
          "moduleResolution": "node"
      }
  }
        `;
}
