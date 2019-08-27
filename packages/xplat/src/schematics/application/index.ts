import { Schema } from './schema';
import { chain } from '@angular-devkit/schematics';
import { prerun, XplatHelpers } from '../../utils';

let packagesToRun: Array<string> = [];
export default function(options: Schema) {
  const externalChains = XplatHelpers.getExternalChainsForApplication(
    options,
    'app',
    packagesToRun
  );

  return chain([prerun(options, true), ...externalChains]);
}
