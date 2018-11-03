import {
  SchematicsException
} from '@angular-devkit/schematics';
import { Schema as ApplicationOptions } from './schema';

export default function (options: ApplicationOptions) {
  if (!options.name) {
    throw new SchematicsException(`Missing name argument. Provide a name for your Electron app. Example: ng g app.electron sample`);
  }
  const appPath = `electron-${options.name}`;
}