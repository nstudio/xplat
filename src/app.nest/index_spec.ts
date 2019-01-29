import { Tree, VirtualTree } from "@angular-devkit/schematics";
import { Schema as ApplicationOptions } from "./schema";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";

import * as path from "path";
import { createEmptyWorkspace, getFileContent } from "../utils";

describe("app.nest schematic", () => {
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
    const tree = schematicRunner.runSchematic("app.nest", options, appTree);
    const files = tree.files;

    expect(
      files.indexOf("/apps/nest-foo/src/main.ts")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/nest-foo/src/app.service.ts")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/nest-foo/src/app.module.ts")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/nest-foo/src/app.controller.ts")
    ).toBeGreaterThanOrEqual(0);

    let checkPath = "/apps/nest-foo/package.json";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    expect(checkFile.indexOf(`"name": "foo"`)).toBeGreaterThanOrEqual(0);

    expect(
      files.indexOf("/tools/electron/postinstall.js")
    ).toBeGreaterThanOrEqual(0);
    expect(files.indexOf("/tools/web/postinstall.js")).toBeGreaterThanOrEqual(
      0
    );

    checkPath = "/package.json";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);

    const packageData: any = JSON.parse(checkFile);
    expect(packageData.scripts["serve.nest.foo"]).toBeDefined();
    expect(packageData.scripts["start.nest.foo"]).toBeDefined();
  });
});
