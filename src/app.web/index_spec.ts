import { Tree, VirtualTree } from "@angular-devkit/schematics";
import { Schema as ApplicationOptions } from "./schema";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";

import * as path from "path";
import { createEmptyWorkspace, getFileContent, jsonParse } from "../utils";

describe("app.web schematic", () => {
  const schematicRunner = new SchematicTestRunner(
    "@nstudio/schematics",
    path.join(__dirname, "../collection.json")
  );
  const defaultOptions: ApplicationOptions = {
    name: "foo",
    skipFormat: true
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createEmptyWorkspace(appTree);
  });

  it("should create all files for web app", async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    const tree = await schematicRunner.runSchematicAsync("app", options, appTree).toPromise();
    const files = tree.files;
    // console.log(files);

    expect(
      files.indexOf("/apps/web-foo/tsconfig.json")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/web-foo/src/main.ts")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/web-foo/src/app/app.module.ts")
    ).toBeGreaterThanOrEqual(0);

    let checkPath = "/apps/web-foo/src/app/app.component.html";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = "/package.json";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts["start.web.foo"]).toBeDefined();
  });

  it("should create all files for web app using groupByName", async () => {
    const options: ApplicationOptions = { ...defaultOptions };
    options.groupByName = true;
    const tree = await schematicRunner.runSchematicAsync("app", options, appTree).toPromise();
    const files = tree.files;
    // console.log(files);

    expect(
      files.indexOf("/apps/foo-web/tsconfig.json")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/foo-web/src/main.ts")
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf("/apps/foo-web/src/app/app.module.ts")
    ).toBeGreaterThanOrEqual(0);

    let checkPath = "/apps/foo-web/src/app/app.component.html";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = "/package.json";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts["start.foo.web"]).toBeDefined();
  });

  it("should create all files for web app using addHeadlessE2e", async () => {
    const options: ApplicationOptions = { ...defaultOptions, addHeadlessE2e: true };
    const tree = await schematicRunner.runSchematicAsync("app", options, appTree).toPromise();
    const files = tree.files;
    const appName = "web-foo";
    // console.log(files);

    expect(
      files.indexOf(`/apps/${appName}/tsconfig.json`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`/apps/${appName}/src/main.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`/apps/${appName}/src/app/app.module.ts`)
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(`/apps/${appName}-e2e/protractor.headless.js`)
    ).toBeGreaterThanOrEqual(0);

    let checkPath = `/apps/${appName}/src/app/app.component.html`;
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkPath = "/package.json";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    let checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const packageData: any = jsonParse(checkFile);
    expect(packageData.scripts["start.web.foo"]).toBeDefined();

    checkPath = "/angular.json";
    expect(files.indexOf(checkPath)).toBeGreaterThanOrEqual(0);

    checkFile = getFileContent(tree, checkPath);
    // console.log(checkFile);
    const angularJson: any = jsonParse(checkFile);
    expect(angularJson.projects[`${appName}-e2e`].architect.e2e.configurations.ci).toBeDefined();
  });
});
