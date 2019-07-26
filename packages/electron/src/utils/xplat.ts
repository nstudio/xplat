import { Tree, SchematicContext } from '@angular-devkit/schematics';
import {
  XplatHelpers,
  getNpmScope,
  getJsonFromFile,
  updatePackageScripts
} from '@nstudio/xplat';
import {
  waitOnVersion,
  npmRunAllVersion,
  electronUpdaterVersion,
  electronStoreVersion,
  electronReloadVersion,
  electronPackagerVersion,
  electronInstallerDmgVersion,
  electronRebuildVersion,
  electronBuilderVersion,
  electronVersion
} from './versions';

export namespace XplatElectrontHelpers {
  export interface SchemaApp {
    /**
     * The name of the app.
     */
    name: string;
    /**
     * The web app target to use inside the electron app
     */
    target: string;
    directory?: string;
    /**
     * npm scope - auto detected from nx.json but can specify your own name
     */
    npmScope?: string;
    /**
     * The prefix to apply to generated selectors.
     */
    prefix?: string;
    /**
     * Group by app name (appname-platform) instead of the default (platform-appname)
     */
    groupByName?: boolean;
    /**
     * Skip installing dependencies
     */
    skipInstall?: boolean;
    /**
     * Skip generating xplat supporting architecture
     */
    skipXplat?: boolean;
    /**
     * Skip formatting files
     */
    skipFormat?: boolean;
    /**
     * testing helper
     */
    isTesting?: boolean;
  }

  export function updateRootDeps(options: XplatHelpers.Schema) {
    return (tree: Tree, context: SchematicContext) => {
      const dependencies = {};
      // dependencies[`@${getNpmScope()}/scss`] = 'file:libs/scss';
      // dependencies[`@${getNpmScope()}/web`] = 'file:xplat/web';
      return XplatHelpers.updatePackageForXplat(options, {
        dependencies,
        devDependencies: {
          electron: electronVersion,
          'electron-builder': electronBuilderVersion,
          'electron-rebuild': electronRebuildVersion,
          'electron-installer-dmg': electronInstallerDmgVersion,
          'electron-packager': electronPackagerVersion,
          'electron-reload': electronReloadVersion,
          'electron-store': electronStoreVersion,
          'electron-updater': electronUpdaterVersion,
          'npm-run-all': npmRunAllVersion,
          'wait-on': waitOnVersion
        }
      })(tree, context);
    };
  }

  export function addNpmScripts(options: SchemaApp) {
    return (tree: Tree) => {
      const platformApp = options.name.replace('-', '.');
      let fullTargetAppName = options.target;
      let targetAppScript = fullTargetAppName.replace('-', '.');

      const packageConfig = getJsonFromFile(tree, 'package.json');
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
      scripts[
        `build.${platformApp}`
      ] = `npm run prepare.${platformApp} && ng build ${
        options.name
      } --prod --base-href ./`;
      scripts[
        `build.${platformApp}.local`
      ] = `npm run build.${platformApp} && electron dist/apps/${options.name}`;
      scripts[
        `build.${platformApp}.linux`
      ] = `npm run build.${platformApp} && cd dist/apps/${
        options.name
      } && npx electron-builder build --linux`;
      scripts[
        `build.${platformApp}.windows`
      ] = `npm run build.${platformApp} && cd dist/apps/${
        options.name
      } && npx electron-builder build --windows`;
      scripts[
        `build.${platformApp}.mac`
      ] = `npm run build.${platformApp} && cd dist/apps/${
        options.name
      } && npx electron-builder build --mac`;
      scripts[
        `prepare.${platformApp}`
      ] = `npm run postinstall.electron && tsc -p apps/${
        options.name
      }/tsconfig.json`;
      scripts[`serve.${platformApp}.target`] = `ng serve ${options.name}`;
      scripts[
        `serve.${platformApp}`
      ] = `wait-on http-get://localhost:4200/ && electron apps/${
        options.name
      }/src --serve`;
      scripts[
        `start.${platformApp}`
      ] = `npm run prepare.${platformApp} && npm-run-all -p serve.${platformApp}.target serve.${platformApp}`;

      // adjust web related scripts to account for postinstall hooks
      const startWeb = scripts[`start.${targetAppScript}`];
      const postinstallWeb = 'npm run postinstall.web';

      if (startWeb) {
        // prefix it
        scripts[
          `start.${targetAppScript}`
        ] = `${postinstallWeb} && ${startWeb}`;
      } else {
        // create to be consistent
        scripts[
          `start.${targetAppScript}`
        ] = `${postinstallWeb} && ng serve ${fullTargetAppName}`;
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
    };
  }
}
