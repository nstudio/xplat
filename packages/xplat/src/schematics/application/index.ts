import { Schema } from './schema';
import { chain, Tree } from '@angular-devkit/schematics';
import { prerun } from '@nstudio/xplat-utils';
import { XplatHelpers } from '../../utils';

let packagesToRun: Array<string> = [];
export default function (options: Schema) {
  const externalChains = XplatHelpers.getExternalChainsForApplication(
    options,
    'app',
    packagesToRun
  );

  return chain([prerun(options, true), (tree: Tree) => chain(externalChains)]);
}
