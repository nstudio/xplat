import { generate } from '@nstudio/angular';
import { Schema as featureOptions } from './schema';

export default function(options: featureOptions) {
  return generate('directive', options);
}
