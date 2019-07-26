import { chain } from '@angular-devkit/schematics';
import { prerun, XplatHelpers, XplatFeatureHelpers } from '../../utils';

let packagesToRunXplat: Array<string> = [];
export default function(options: XplatFeatureHelpers.Schema) {
  const externalChains = XplatHelpers.getExternalChainsForGenerator(
    options,
    'feature',
    packagesToRunXplat
  );

  return chain([prerun(options, true), ...externalChains]);
}
