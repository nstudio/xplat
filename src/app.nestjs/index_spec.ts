import { Tree, VirtualTree } from "@angular-devkit/schematics";
import { Schema as ApplicationOptions } from "./schema";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";

import * as path from "path";
import { createEmptyWorkspace } from "../utils";

describe("app.nestjs schematic", () => {
  const schematicRunner = new SchematicTestRunner(
    "@nstudio/schematics",
    path.join(__dirname, "../collection.json")
  );
  const defaultOptions: ApplicationOptions = {
    name: "foo",
    npmScope: "testing"
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  it("should create all files for node app", () => {
    const options: ApplicationOptions = { ...defaultOptions };
    const tree = schematicRunner.runSchematic("app.nestjs", options, appTree);
    const files = tree.files;

    let checkPath = "/apps/nestjs-foo/src/main.ts";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);
  });
});
