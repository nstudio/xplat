import {
  Tree,
  SchematicContext,
  Rule,
  SchematicsException,
  noop
} from '@angular-devkit/schematics';
import { PlatformTypes } from '@nstudio/xplat';
import { supportedPlatforms } from './general';
import { helperMissingPlatforms, helperTargetError } from './errors';

export interface IHelperSchema {
  /**
   * Singular or Comma-delimited list of helpers to generate.
   */
  name: string;
  /**
   * Optional target when adding helpers
   */
  target?: string;
}

// Configuration options for each helper
export interface IHelperConfig {
  requiresTarget?: boolean;
  additionalSupport?: (
    helperChains: Array<any>,
    options: IHelperSchema
  ) => (tree: Tree, context: SchematicContext) => void;
  addHelperFiles?: (options: IHelperSchema) => Rule;
  logNotes?: (options: IHelperSchema) => void;
}

export function buildHelperChain(
  helper: string,
  options: IHelperSchema,
  config: IHelperConfig,
  helperChain: Array<any>
) {
  // throw if target required and it's missing
  if (config.requiresTarget && !options.target) {
    throw new SchematicsException(helperTargetError(helper));
  }

  if (config.addHelperFiles) {
    // add files for the helper
    helperChain.push((tree: Tree, context: SchematicContext) => {
      return config.addHelperFiles(options)(tree, context);
    });
  }

  if (config.additionalSupport) {
    // process additional support modifications
    helperChain.push((tree: Tree, context: SchematicContext) => {
      return config.additionalSupport(helperChain, options)(tree, context);
    });
  }

  if (config.logNotes) {
    helperChain.push((tree: Tree) => {
      config.logNotes(options);
      return noop();
    });
  }
}
