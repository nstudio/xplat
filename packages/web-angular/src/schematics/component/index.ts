import { chain } from '@angular-devkit/schematics';
import { ComponentHelpers } from '@nstudio/angular';

export default function(options: ComponentHelpers.Schema) {
  return chain(ComponentHelpers.platformGenerator(options, 'web'));
}
