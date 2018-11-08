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
  TemplateOptions,
  move,
  noop
} from '@angular-devkit/schematics';
import { Schema as ApplicationOptions } from './schema';
import { prerun, getPrefix, getNpmScope, stringUtils, addRootDeps, updateAngularProjects, updateNxProjects, formatFiles, getJsonFromFile, updatePackageScripts, addPostinstallers } from '../utils';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(`Missing name argument. Provide a name for your Electron app. Example: ng g app.electron sample`);
  }
  if (!options.target) {
    throw new SchematicsException(`Missing target argument. Provide the name of the web app in your workspace to use inside the electron app. ie, web-myapp`);
  }
  const appPath = `electron-${options.name}`;

  return chain([
    prerun(options.prefix),
    // create app files
    (tree: Tree, context: SchematicContext) => addAppFiles(options, appPath)(tree, context),
    // add root package dependencies
    (tree: Tree) => addRootDeps(tree, {electron: true}),
    // add npm scripts
    (tree: Tree) => {
      let fullTargetAppName = options.target;
      let targetAppName = fullTargetAppName;
      if (targetAppName.indexOf('web-') === 0) {
        // normalize just the target app name
        targetAppName = targetAppName.replace('web-', '');
      }
      const packageConfig = getJsonFromFile(tree, "package.json");
      const scripts = packageConfig.scripts || {};
      const postinstall = 'npx electron-builder install-app-deps';
      if (scripts.postinstall) {
        // add to the end of already existing postinstall
        scripts['postinstall'] = `${scripts.postinstall} && ${postinstall}`;
      } else {
        scripts['postinstall'] = postinstall;
      }
      scripts['postinstall.electron'] = 'node tools/electron/postinstall';
      scripts['postinstall.web'] = 'node tools/web/postinstall';
      scripts[`build.electron.${options.name}`] = `npm run prepare.electron.${options.name} && ng build electron-${options.name} --prod --base-href ./`;
      scripts[`build.electron.${options.name}.local`] = `npm run build.electron.${options.name} && electron dist/apps/electron-${options.name}`;
      scripts[`build.electron.${options.name}.linux`] = `npm run build.electron.${options.name} && cd dist/apps/electron-${options.name} && npx electron-builder build --linux`;
      scripts[`build.electron.${options.name}.windows`] = `npm run build.electron.${options.name} && cd dist/apps/electron-${options.name} && npx electron-builder build --windows`;
      scripts[`build.electron.${options.name}.mac`] = `npm run build.electron.${options.name} && cd dist/apps/electron-${options.name} && npx electron-builder build --mac`;
      scripts[`prepare.electron.${options.name}`] = `npm run postinstall.electron && tsc -p apps/electron-${options.name}/tsconfig.json`;
      scripts[`serve.electron.${options.name}.target`] = `ng serve electron-${options.name}`;
      scripts[`serve.electron.${options.name}`] = `wait-on http-get://localhost:4200/ && electron apps/electron-${options.name}/src --serve`;
      scripts[`start.electron.${options.name}`] = `npm run prepare.electron.myapp && npm-run-all -p serve.electron.${options.name}.target serve.electron.${options.name}`;

      // adjust web related scripts to account for postinstall hooks
      const startWeb = scripts[`start.web.${targetAppName}`];
      const postinstallWeb = 'npm run postinstall.web';

      if (startWeb) {
        // prefix it
        scripts[`start.web.${targetAppName}`] = `${postinstallWeb} && ${startWeb}`;
      } else {
        // create to be consistent
        scripts[`start.web.${targetAppName}`] = `${postinstallWeb} && ng serve ${fullTargetAppName}`;
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
      const electronAppName = `electron-${options.name}`;
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
      projects[`electron-${options.name}`] = {
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
  return branchAndMerge(
    mergeWith(apply(url(`./_${sample}files`), [
      template(<TemplateOptions>{
        ...options as any,
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