import { Schema } from './schema';
import { chain } from '@angular-devkit/schematics';
import { prerun, XplatHelpers } from '../../utils';

let packagesToRunXplat: Array<string> = [];
export default function(options: Schema) {
  const externalChains = XplatHelpers.getExternalChainsForGenerator(
    options,
    'app',
    packagesToRunXplat
  );

  return chain([prerun(options, true), ...externalChains]);
}
