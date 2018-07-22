import { Rule, Tree, chain } from "@angular-devkit/schematics";

import { Schema as ConfigOptions } from "./schema";
import { updatePackageScripts } from "../utils";

export default function(options: ConfigOptions): Rule {
  return chain([
    (tree: Tree) => {
      const scripts = {};
      scripts[
        `start.${options.name || "admin"}`
      ] = `electron ./node_modules/@nstudio/schematics/admin`;
      return updatePackageScripts(tree, scripts);
    }
  ]);
}
