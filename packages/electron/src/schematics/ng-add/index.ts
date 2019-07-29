import {
  chain,
  externalSchematic,
  Tree,
  SchematicContext,
  noop
} from '@angular-devkit/schematics';
import { prerun, XplatHelpers, addInstallTask } from '@nstudio/xplat';
import { XplatElectrontHelpers } from '../../utils';

export default function(options: XplatHelpers.NgAddSchema) {
  const chains = [];

  if (options.platforms) {
    // running from @nstudio/xplat:init --platforms electron
    chains.push((tree: Tree, context: SchematicContext) =>
      externalSchematic('@nstudio/electron', 'xplat', options)
    );
  } else {
    // running directly with @nstudio/electron, just add deps
    chains.push(XplatElectrontHelpers.updateRootDeps(options));
    chains.push(addInstallTask(options));
  }
  return chain([prerun(options, true), ...chains]);
}
