import { chain, Tree } from '@angular-devkit/schematics';
import { prerun } from '@nstudio/xplat-utils';
import { XplatHelpers, XplatComponentHelpers } from '../../utils';

let packagesToRunXplat: Array<string> = [];
export default function (options: XplatComponentHelpers.Schema) {
  const externalChains = XplatHelpers.getExternalChainsForGenerator(
    options,
    'component',
    packagesToRunXplat
  );

  return chain([prerun(options, true), (tree: Tree) =>
    chain(externalChains)]);
}
