import { chain } from '@angular-devkit/schematics';
import { XplatComponentHelpers } from '@nstudio/xplat';
import { ComponentHelpers } from '@nstudio/angular';

export default function(options: XplatComponentHelpers.Schema) {
  return chain(ComponentHelpers.platformGenerator(options, 'ionic'));
}
