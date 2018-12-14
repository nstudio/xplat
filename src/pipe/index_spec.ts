import { Tree, VirtualTree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import { getFileContent } from "@schematics/angular/utility/test";
import * as path from "path";

import { Schema as GenerateOptions } from "./schema";
import { createXplatWithApps } from "../utils";

describe("pipe schematic", () => {
  const schematicRunner = new SchematicTestRunner(
    "@nstudio/schematics",
    path.join(__dirname, "../collection.json")
  );
  const defaultOptions: GenerateOptions = {
    name: "truncate"
  };

  let appTree: Tree;

  beforeEach(() => {
    appTree = new VirtualTree();
    appTree = createXplatWithApps(appTree);
  });

  it("should create pipe in libs by default for use across any platform and apps", () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      "xplat",
      {
        prefix: "tt",
        platforms: "nativescript,web"
      },
      appTree
    );
    tree = schematicRunner.runSchematic(
      "app.nativescript",
      {
        name: "viewer",
        prefix: "tt"
      },
      tree
    );
    tree = schematicRunner.runSchematic(
      "feature",
      {
        name: "foo",
        platforms: "nativescript,web"
      },
      tree
    );
    let options: GenerateOptions = { ...defaultOptions };
    tree = schematicRunner.runSchematic("pipe", options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf("/libs/features/ui/pipes/truncate.pipe.ts")
    ).toBeGreaterThanOrEqual(0);

    // file content
    let content = getFileContent(
      tree,
      "/libs/features/ui/pipes/truncate.pipe.ts"
    );
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'truncate'`)).toBeGreaterThanOrEqual(0);
  });

  it("should create pipe in libs and handle camel case properly", () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      "xplat",
      {
        prefix: "tt",
        platforms: "nativescript,web"
      },
      appTree
    );
    tree = schematicRunner.runSchematic(
      "app.nativescript",
      {
        name: "viewer",
        prefix: "tt"
      },
      tree
    );
    tree = schematicRunner.runSchematic(
      "feature",
      {
        name: "foo",
        platforms: "nativescript,web"
      },
      tree
    );
    let options: GenerateOptions = { 
      ...defaultOptions,
      name: 'test-with-dashes'
    };
    tree = schematicRunner.runSchematic("pipe", options, tree);
    const files = tree.files;
    // console.log(files.slice(91,files.length));

    // component
    expect(
      files.indexOf("/libs/features/ui/pipes/test-with-dashes.pipe.ts")
    ).toBeGreaterThanOrEqual(0);

    // file content
    let content = getFileContent(
      tree,
      "/libs/features/ui/pipes/test-with-dashes.pipe.ts"
    );
    // console.log(content);
    expect(content.indexOf(`@Pipe({`)).toBeGreaterThanOrEqual(0);
    expect(content.indexOf(`name: 'testWithDashes'`)).toBeGreaterThanOrEqual(0);
  });

  it("should THROW if feature module does not exist in libs", () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      "xplat",
      {
        prefix: "tt",
        platforms: "web"
      },
      appTree
    );
    const options: GenerateOptions = { ...defaultOptions };
    options.feature = "register";
    expect(
      () => (tree = schematicRunner.runSchematic("pipe", options, tree))
    ).toThrowError(
      `libs/features/register/register.module.ts does not exist. Create the feature module first. For example: ng g feature register`
    );
  });

  it("should create pipe for specified projects only", () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      "xplat",
      {
        prefix: "tt",
        platforms: "nativescript,web"
      },
      appTree
    );
    tree = schematicRunner.runSchematic(
      "app.nativescript",
      {
        name: "viewer",
        prefix: "tt"
      },
      tree
    );
    tree = schematicRunner.runSchematic(
      "feature",
      {
        name: "foo",
        projects: "nativescript-viewer,web-viewer",
        onlyProject: true
      },
      tree
    );
    const options: GenerateOptions = {
      name: "truncate",
      feature: "foo",
      projects: "nativescript-viewer,web-viewer"
    };
    tree = schematicRunner.runSchematic("pipe", options, tree);
    const files = tree.files;
    // console.log(files. slice(91,files.length));

    // pipe should not be setup to share
    expect(files.indexOf("/libs/features/ui/pipes/truncate.pipe.ts")).toBe(-1);
    expect(
      files.indexOf("/xplat/nativescript/features/foo/pipes/truncate.pipe.ts")
    ).toBe(-1);
    expect(
      files.indexOf("/xplat/web/features/foo/pipes/truncate.pipe.ts")
    ).toBe(-1);

    // pipe should be project specific
    expect(
      files.indexOf(
        "/apps/nativescript-viewer/app/features/foo/pipes/truncate.pipe.ts"
      )
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf(
        "/apps/web-viewer/src/app/features/foo/pipes/truncate.pipe.ts"
      )
    ).toBeGreaterThanOrEqual(0);

    // file content
    let pipeIndexPath =
      "/apps/nativescript-viewer/app/features/foo/pipes/index.ts";
    let pipeIndex = getFileContent(tree, pipeIndexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    // component symbol should be at end of components collection
    expect(pipeIndex.indexOf(`TruncatePipe`)).toBeGreaterThanOrEqual(0);

    let modulePath = "/apps/nativescript-viewer/app/features/foo/foo.module.ts";
    let moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PIPES`)).toBeGreaterThanOrEqual(0);

    pipeIndexPath = "/apps/web-viewer/src/app/features/foo/pipes/index.ts";
    pipeIndex = getFileContent(tree, pipeIndexPath);
    // console.log(barrelPath + ':');
    // console.log(barrelIndex);
    expect(pipeIndex.indexOf(`TruncatePipe`)).toBeGreaterThanOrEqual(0);

    modulePath = "/apps/web-viewer/src/app/features/foo/foo.module.ts";
    moduleContent = getFileContent(tree, modulePath);
    // console.log(modulePath + ':');
    // console.log(moduleContent);
    expect(moduleContent.indexOf(`...FOO_PIPES`)).toBeGreaterThanOrEqual(0);
  });

  it("should THROW if feature module does not exist in shared code", () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      "xplat",
      {
        prefix: "tt",
        platforms: "nativescript,web"
      },
      appTree
    );
    const options: GenerateOptions = {
      name: "truncate",
      feature: "register",
      platforms: "nativescript,web"
    };

    expect(
      () => (tree = schematicRunner.runSchematic("pipe", options, tree))
    ).toThrowError(
      `xplat/nativescript/features/register/register.module.ts does not exist. Create the feature module first. For example: ng g feature register --platforms=nativescript --onlyModule`
    );
  });

  it("should THROW if feature module does not exist in projects", () => {
    // console.log('appTree:', appTree);
    let tree = schematicRunner.runSchematic(
      "xplat",
      {
        prefix: "tt",
        platforms: 'nativescript,web'
      },
      appTree
    );
    const options: GenerateOptions = {
      name: "truncate",
      feature: "register",
      projects: "nativescript-viewer,web-viewer"
    };

    expect(
      () => (tree = schematicRunner.runSchematic("pipe", options, tree))
    ).toThrowError(
      `apps/nativescript-viewer/app/features/register/register.module.ts does not exist. Create the feature module first. For example: ng g feature register --projects=nativescript-viewer --onlyModule`
    );
  });
});
