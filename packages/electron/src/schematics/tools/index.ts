import {
  chain,
  branchAndMerge,
  mergeWith,
  apply,
  url,
  template,
  move
} from '@angular-devkit/schematics';

export default function(options: any) {
  return chain([addTools(options)]);
}

function addTools(options: any) {
  return branchAndMerge(
    mergeWith(
      apply(url(`./_files`), [
        template({
          ...(options as any)
        }),
        move(`tools`)
      ])
    )
  );
}
