import { SchematicsException, chain, Rule, branchAndMerge, mergeWith, apply, url, template, move } from "@angular-devkit/schematics";
import { missingArgument, prerun, getDefaultTemplateOptions } from "@nstudio/xplat";
import { Schema } from './schema';

export default function(options: Schema) {
  if (!options.name) {
    throw new SchematicsException(
      missingArgument(
        'name',
        'Provide the name of the native ui to generate.',
        'nx g native-ui yourview'
      )
    );
  }

  return chain([prerun(options), addFiles(options)]);
}

function addFiles(
  options: Schema,
  extra: string = ''
): Rule {
  extra = extra ? `${extra}_` : '';
  return branchAndMerge(
    mergeWith(
      apply(url(`./_${extra}files`), [
        template({
          ...(options as any),
          ...getDefaultTemplateOptions()
        }),
        move(`xplat/nativescript/features/native-ui`)
      ])
    )
  );
}