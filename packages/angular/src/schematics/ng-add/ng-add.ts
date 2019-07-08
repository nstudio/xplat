import { JsonObject } from '@angular-devkit/core';
import {
  updateWorkspace
} from '@nrwl/workspace';
import {
  IHelperSchema,
  buildHelperChain,
  unsupportedHelperError,
  prerun,
  missingArgument
} from '@nstudio/workspace';
import { Schema } from './schema';
import { SchematicsException, chain, noop, externalSchematic, Rule } from '@angular-devkit/schematics';

export default function(options: Schema) {
  return chain([
    prerun(options),
    externalSchematic('@nrwl/angular', 'ng-add', options),
    setDefaults(options)
  ]);
}

export function setDefaults(options: Schema): Rule {
  return updateWorkspace(workspace => {
    workspace.extensions.schematics = workspace.extensions.schematics || {};

    workspace.extensions.schematics['@nstudio/angular:application'] =
      workspace.extensions.schematics['@nstudio/angular:application'] || {};
    workspace.extensions.schematics[
      '@nstudio/angular:application'
    ].unitTestRunner =
      workspace.extensions.schematics['@nrwl/angular:application']
        .unitTestRunner || options.unitTestRunner;
    workspace.extensions.schematics['@nstudio/angular:application'].e2eTestRunner =
      workspace.extensions.schematics['@nstudio/angular:application']
        .e2eTestRunner || options.e2eTestRunner;

    workspace.extensions.cli = workspace.extensions.cli || {};
    const defaultCollection: string =
      workspace.extensions.cli &&
      ((workspace.extensions.cli as JsonObject).defaultCollection as string);

    if (!defaultCollection || defaultCollection === '@nrwl/angular' || defaultCollection === '@nrwl/workspace' || defaultCollection === '@nstudio/workspace') {
      (workspace.extensions.cli as JsonObject).defaultCollection =
        '@nstudio/angular';
    }
  });
}
