import {
  PlatformTypes,
  supportedSandboxPlatforms,
  supportedPlatforms,
  getDefaultTemplateOptions,
  stringUtils,
  FrameworkTypes
} from './general';
import {
  SchematicsException,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move,
  Tree,
  Rule
} from '@angular-devkit/schematics';
import {
  platformAppPrefixError,
  generatorError,
  optionsMissingError
} from './errors';
import { createSourceFile, ScriptTarget } from 'typescript';
import { insert, addGlobal } from './ast';
import { XplatHelpers } from './xplat';
