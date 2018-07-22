import {
  apply,
  // branchAndMerge,
  chain,
  move,
  template,
  url,
  mergeWith,
  TemplateOptions
} from "@angular-devkit/schematics";

import { Schema as AppResourcesSchema } from "./schema";

export default function(options: AppResourcesSchema) {
  return chain([
    mergeWith(
      apply(url("./_files"), [
        template(<TemplateOptions>{
          name: options.name
        }),
        move(options.path)
      ])
    )
  ]);
}
