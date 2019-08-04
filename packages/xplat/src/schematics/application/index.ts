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

// TODO: Allow prompts for all Nx generators
// Right now the x-prompt for what frontend framework should it use comes up for all options
// use 2 schematics which conditionally execute depending upon the first app type choice
// "items": [
//   {
//     "value": "electron",
//     "label": "electron        [Electron app]"
//   },
//   {
//     "value": "express",
//     "label": "express         [Express app]"
//   },
//   {
//     "value": "ionic",
//     "label": "ionic           [Ionic app]"
//   },
//   {
//     "value": "nativescript",
//     "label": "nativescript    [NativeScript app]"
//   },
//   {
//     "value": "nest",
//     "label": "nest            [Nest app]"
//   },
//   {
//     "value": "node",
//     "label": "node            [Node app]"
//   },
//   {
//     "value": "react",
//     "label": "react           [React app]"
//   },
//   {
//     "value": "web",
//     "label": "web             [Web app]"
//   }
// ]
