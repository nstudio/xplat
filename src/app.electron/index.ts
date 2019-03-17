import {
  chain,
  Tree,
  SchematicContext,
  SchematicsException,
  branchAndMerge,
  Rule,
  mergeWith,
  apply,
  url,
  template,
  move,
  noop
} from '@angular-devkit/schematics';
import { Schema as ApplicationOptions } from './schema';
import { prerun, getPrefix, getNpmScope, stringUtils, addRootDeps, updateAngularProjects, updateNxProjects, formatFiles, getJsonFromFile, updatePackageScripts, addPostinstallers, applyAppNamingConvention, getGroupByName, getAppName, missingArgument } from '../utils';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument('name', 'Provide a name for your Electron app.', 'ng g app.electron sample')
    );
  }
  if (!options.target) {
    throw new SchematicsException(`Missing target argument. Provide the name of the web app in your workspace to use inside the electron app. ie, web-myapp`);
  }

  return chain([
    prerun(options),
    // adjust naming convention
    applyAppNamingConvention(options, 'electron'),
    // create app files
    (tree: Tree, context: SchematicContext) => addAppFiles(options, options.name)(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, {electron: true}),
    // add npm scripts
    (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      let fullTargetAppName = options.target;
      let targetAppScript = fullTargetAppName.replace('-', '.');
      
      const packageConfig = getJsonFromFile(tree, "package.json");
      const scripts = packageConfig.scripts || {};
      const postinstall = 'electron-rebuild install-app-deps';
      if (scripts.postinstall) {
        // add to the end of already existing postinstall
        scripts['postinstall'] = `${scripts.postinstall} && ${postinstall}`;
      } else {
        scripts['postinstall'] = postinstall;
      }
      scripts['postinstall.electron'] = 'node tools/electron/postinstall';
      scripts['postinstall.web'] = 'node tools/web/postinstall';
      scripts[`build.${platformApp}`] = `npm run prepare.${platformApp} && ng build ${options.name} --prod --base-href ./`;
      scripts[`build.${platformApp}.local`] = `npm run build.${platformApp} && electron dist/apps/${options.name}`;
      scripts[`build.${platformApp}.linux`] = `npm run build.${platformApp} && cd dist/apps/${options.name} && npx electron-builder build --linux`;
      scripts[`build.${platformApp}.windows`] = `npm run build.${platformApp} && cd dist/apps/${options.name} && npx electron-builder build --windows`;
      scripts[`build.${platformApp}.mac`] = `npm run build.${platformApp} && cd dist/apps/${options.name} && npx electron-builder build --mac`;
      scripts[`prepare.${platformApp}`] = `npm run postinstall.electron && tsc -p apps/${options.name}/tsconfig.json`;
      scripts[`serve.${platformApp}.target`] = `ng serve ${options.name}`;
      scripts[`serve.${platformApp}`] = `wait-on http-get://localhost:4200/ && electron apps/${options.name}/src --serve`;
      scripts[`start.${platformApp}`] = `npm run prepare.${platformApp} && npm-run-all -p serve.${platformApp}.target serve.${platformApp}`;

      // adjust web related scripts to account for postinstall hooks
      const startWeb = scripts[`start.${targetAppScript}`];
      const postinstallWeb = 'npm run postinstall.web';

      if (startWeb) {
        // prefix it
        scripts[`start.${targetAppScript}`] = `${postinstallWeb} && ${startWeb}`;
      } else {
        // create to be consistent
        scripts[`start.${targetAppScript}`] = `${postinstallWeb} && ng serve ${fullTargetAppName}`;
      }
      let startDefault = scripts[`start`];
      if (startDefault) {
        // prefix it
        if (startDefault.indexOf(fullTargetAppName) === -1) {
          // set target app as default
          startDefault = `${startDefault} ${fullTargetAppName}`;
        }
        scripts[`start`] = `${postinstallWeb} && ${startDefault}`;
      } else {
        scripts[`start`] = `${postinstallWeb} && ng serve ${fullTargetAppName}`;
      }
      let buildDefault = scripts[`build`];
      if (buildDefault) {
        // prefix it
        if (buildDefault.indexOf(fullTargetAppName) === -1) {
          // set target app as default
          buildDefault = `${buildDefault} ${fullTargetAppName}`;
        }
        scripts[`build`] = `${postinstallWeb} && ${buildDefault}`;
      } else {
        scripts[`build`] = `${postinstallWeb} && ng build ${fullTargetAppName}`;
      }
      let testDefault = scripts[`test`];
      if (testDefault) {
        // prefix it
        scripts[`test`] = `${postinstallWeb} && ${testDefault}`;
      } else {
        scripts[`test`] = `${postinstallWeb} && ng test`;
      }
      let e2eDefault = scripts[`e2e`];
      if (e2eDefault) {
        // prefix it
        scripts[`e2e`] = `${postinstallWeb} && ${e2eDefault}`;
      } else {
        scripts[`e2e`] = `${postinstallWeb} && ng e2e`;
      }

      return updatePackageScripts(tree, scripts);
    },
    // angular.json
    (tree: Tree) => {
      // grab the target app configuration
      const ngConfig = getJsonFromFile(tree, "angular.json");
      // find app
      const fullTargetAppName = options.target;
      let targetConfig;
      if (ngConfig && ngConfig.projects) {
        targetConfig = ngConfig.projects[fullTargetAppName];
      }
      if (!targetConfig) {
        throw new SchematicsException(`The target app name "${fullTargetAppName}" does not appear to be in your workspace angular.json. You may need to generate it first or perhaps check the spelling.`);
      }
 
      const projects = {};
      const electronAppName = options.name;
      projects[electronAppName] = targetConfig;
      // update to use electron module
      projects[electronAppName].architect.build.options.outputPath = `dist/apps/${electronAppName}`;
      projects[electronAppName].architect.build.options.main = `apps/${fullTargetAppName}/src/main.electron.ts`;
      projects[electronAppName].architect.build.options.assets.push({
        "glob": "**/*",
        "input": `apps/${electronAppName}/src/`,
        "ignore": [
          "**/*.ts"
        ],
        "output": ""
      });
      projects[electronAppName].architect.serve.options.browserTarget = `${electronAppName}:build`;
      projects[electronAppName].architect.serve.configurations.production.browserTarget = `${electronAppName}:build:production`;
      // clear other settings (TODO: may need these in future), for now keep electron options minimal
      delete projects[electronAppName].architect['extract-i18n'];
      delete projects[electronAppName].architect['test'];
      delete projects[electronAppName].architect['lint'];
      return updateAngularProjects(tree, projects);
    },
    // nx.json
    (tree: Tree) => {
      const projects = {};
      projects[`${options.name}`] = {
        tags: []
      };
      return updateNxProjects(tree, projects);
    },
    // adjust app files
    (tree: Tree) => adjustAppFiles(options, tree),
    // add tooling
    addPostinstallers(),

    options.skipFormat 
      ? noop()
      : formatFiles(options)
  ]);
}

function addAppFiles(options: ApplicationOptions, appPath: string, sample: string = ''): Rule {
  sample = '';
  const appname = getAppName(options, 'electron');
  return branchAndMerge(
    mergeWith(apply(url(`./_${sample}files`), [
      template({
        ...options as any,
        appname,
        utils: stringUtils,
        npmScope: getNpmScope(),
        prefix: getPrefix(),
        dot: '.',
      }),
      move(`apps/${appPath}`)
    ]))
  );
}

function adjustAppFiles(options: ApplicationOptions, tree: Tree) {
  const fullTargetAppName = options.target;
  const electronModulePath = `/apps/${fullTargetAppName}/src/app/app.electron.module.ts`;
  if (!tree.exists(electronModulePath)) {
    tree.create(electronModulePath, electronModule());
  }
  const electronMainPath = `/apps/${fullTargetAppName}/src/main.electron.ts`;
  if (!tree.exists(electronMainPath)) {
    tree.create(electronMainPath, electronMain());
  }
  return tree;
}

function electronModule() {
  return `import { NgModule } from '@angular/core';
import { ${stringUtils.classify(getPrefix())}ElectronCoreModule } from '@${getNpmScope()}/electron';
import { AppModule } from './app.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [AppModule, ${stringUtils.classify(getPrefix())}ElectronCoreModule],
  bootstrap: [AppComponent]
})
export class AppElectronModule {}`;
}

function electronMain() {
  return `import { enableProdMode } from '@angular/core';
  import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
  
  // libs
  import { environment } from '@${getNpmScope()}/core';
  
  // app
  import { AppElectronModule } from './app/app.electron.module';
  
  if (environment.production) {
    enableProdMode();
  }
  
  platformBrowserDynamic()
    .bootstrapModule(AppElectronModule)
    .catch(err => console.log(err));
  `;
}