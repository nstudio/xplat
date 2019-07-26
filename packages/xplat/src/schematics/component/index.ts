import { chain } from '@angular-devkit/schematics';
import { prerun, XplatHelpers, XplatComponentHelpers } from '../../utils';

let packagesToRunXplat: Array<string> = [];
export default function(options: XplatComponentHelpers.Schema) {
  const externalChains = XplatHelpers.getExternalChainsForGenerator(
    options,
    'component',
    packagesToRunXplat
  );

  return chain([prerun(options, true), ...externalChains]);
}
