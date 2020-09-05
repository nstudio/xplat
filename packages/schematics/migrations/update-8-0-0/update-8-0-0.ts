import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  SchematicsException,
} from '@angular-devkit/schematics';
import { join } from 'path';
import * as fs from 'fs';
import {
  updateJsonInTree,
  readJsonInTree,
  addDepsToPackageJson,
  formatFiles,
  createOrUpdate,
} from '@nrwl/workspace';
import {
  getJsonFromFile,
  updateJsonFile,
  addInstallTask,
} from '@nstudio/xplat-utils';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';

function addDependencies() {
  return (host: Tree, context: SchematicContext) => {
    const packageJson = readJsonInTree(host, 'package.json');
    const dependencies = packageJson.dependencies;
    const devDependencies = packageJson.devDependencies;
    const builders = new Set<string>();
    const projects = readJsonInTree(host, 'angular.json').projects;
    Object.values<any>(projects)
      .filter(
        (project) =>
          typeof project === 'object' && project.hasOwnProperty('architect')
      )
      .forEach((project) => {
        Object.values<any>(project.architect).forEach((target) => {
          const [builderDependency] = target.builder.split(':');
          builders.add(builderDependency);
        });
      });
    const newDependencies = {};
    const newDevDependencies = {
      '@nstudio/xplat': '^8.0.0',
      '@nstudio/angular': '^8.0.0',
    };
    context.logger.info(`Adding @nstudio/xplat as a dependency`);
    if (dependencies['@angular/core']) {
      newDevDependencies['@nstudio/web'] = '^8.0.0';
      newDevDependencies['@nstudio/web-angular'] = '^8.0.0';
      context.logger.info(`Adding @nstudio/angular as a dependency`);
    }
    if (dependencies['nativescript-angular']) {
      newDevDependencies['@nstudio/nativescript'] = '^8.0.0';
      newDevDependencies['@nstudio/nativescript-angular'] = '^8.0.0';
      context.logger.info(`Adding @nstudio/nativescript as a dependency`);
    }
    if (dependencies['electron'] || devDependencies['electron']) {
      newDevDependencies['@nstudio/electron'] = '^8.0.0';
      newDevDependencies['@nstudio/electron-angular'] = '^8.0.0';
      context.logger.info(`Adding @nstudio/electron as a dependency`);
    }
    if (dependencies['@ionic-native'] || devDependencies['@ionic-native']) {
      newDevDependencies['@nstudio/ionic'] = '^8.0.0';
      newDevDependencies['@nstudio/ionic-angular'] = '^8.0.0';
      newDevDependencies['@nstudio/web-angular'] = '^8.0.0';
      context.logger.info(`Adding @nstudio/ionic as a dependency`);
    }

    return chain([<any>addDepsToPackageJson(newDependencies, newDevDependencies)]);
  };
}

const removeOldDependencies = <any>updateJsonInTree(
  'package.json',
  (json, context: any) => {
    json.dependencies = json.dependencies || {};
    json.devDependencies = json.devDependencies || {};

    if (
      json.dependencies['@nrwl/workspace'] ||
      json.devDependencies['@nrwl/workspace']
    ) {
      delete json.dependencies['@nstudio/schematics'];
      delete json.devDependencies['@nstudio/schematics'];
      context.logger.info(`Removing @nstudio/schematics as a dependency`);
    } else {
      throw new SchematicsException(
        'Please run "ng update @nrwl/schematics" first to migrate to Nx 8. If you need more help migrating Nx to version 8 please see this: https://nx.dev/angular/guides/nx7-to-nx8'
      );
    }

    json.xplat = {
      ...(json.xplat || {}),
      // all updates into 8.0 will be angular based since that was all that was previously supported
      framework: 'angular',
    };

    return json;
  }
);

const displayInformation = (host: Tree, context: SchematicContext) => {
  context.logger.info(stripIndents`
    xplat has been repackaged. We are installing and migrating your dependencies to the ones necessary.

    This migration may take a few minutes.
  `);
};

const updateDefaultCollection = (tree: Tree, context: SchematicContext) => {
  const { dependencies, devDependencies } = readJsonInTree(
    tree,
    'package.json'
  );

  let workspaceFile = 'angular.json';
  if (tree.exists('workspace.json')) {
    workspaceFile = 'workspace.json';
  }

  return updateJsonInTree(workspaceFile, (json) => {
    json.cli = json.cli || {};
    if (dependencies['@nstudio/schematics']) {
      json.cli.defaultCollection = '@nstudio/xplat';
    } else if (devDependencies['@nstudio/schematics']) {
      json.cli.defaultCollection = '@nstudio/xplat';
    }
    context.logger.info(
      `Default collection is now set to ${json.cli.defaultCollection}`
    );
    return json;
  });
};

// const addXplatFrameworkIdentifier = (tree: Tree, context: SchematicContext) => {
//   if (tree.exists('/xplat/web/index.ts') && !tree.exists('/xplat/web/.xplatframework')) {
//     tree.create('.xplatframework', 'angular');
//   }
//   if (tree.exists('/xplat/nativescript/index.ts') && !tree.exists('/xplat/nativescript/.xplatframework')) {
//     tree.create('.xplatframework', 'angular');
//   }
//   if (tree.exists('/xplat/ionic/index.ts') && !tree.exists('/xplat/ionic/.xplatframework')) {
//     tree.create('.xplatframework', 'angular');
//   }
//   if (tree.exists('/xplat/electron/index.ts') && !tree.exists('/xplat/electron/.xplatframework')) {
//     tree.create('.xplatframework', 'angular');
//   }
// };

export default function (): Rule {
  return chain([
    displayInformation,
    removeOldDependencies,
    addDependencies(),
    updateDefaultCollection,
    // addXplatFrameworkIdentifier,
    addInstallTask(),
    formatFiles(),
  ]);
}
