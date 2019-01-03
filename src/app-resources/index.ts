import {
  apply,
  // branchAndMerge,
  chain,
  move,
  template,
  url,
  mergeWith,
} from "@angular-devkit/schematics";

import { Schema as AppResourcesSchema } from "./schema";

export default function(options: AppResourcesSchema) {
  return chain([
    mergeWith(
      apply(url("./_files"), [
        template({
          name: options.name
        }),
        move(options.path)
      ])
    )
  ]);
}
