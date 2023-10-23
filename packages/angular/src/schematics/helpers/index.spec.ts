import { Tree } from '@angular-devkit/schematics';
import { Schema as AppWebOptions } from '../application/schema';
import { IHelperSchema } from '@nstudio/xplat';
import { setTest, jsonParse } from '@nstudio/xplat-utils';
import { createXplatWithApps, getFileContent } from '@nstudio/xplat/testing';
import { runSchematic } from '../../utils/testing';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
setTest();

xdescribe('helpers schematic', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createXplatWithApps(appTree);
  });

  it('applitools: should create all files', async () => {
    // const optionsXplat: XPlatOptions = {
    //   npmScope: 'testing',
    //   prefix: 'tt',
    //   platforms: 'web,nativescript'
    // };

    // appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const appOptions: AppWebOptions = {
      name: 'foo',
      prefix: 'tt',
      e2eTestRunner: 'cypress',
      useXplat: false,
    };
    // console.log('appTree:', appTree);
    appTree = await runSchematic('app', appOptions, appTree);

    const cypressJsonPath = '/apps/web-foo-e2e/cypress.json';
    let fileContent = getFileContent(appTree as UnitTestTree, cypressJsonPath);
    let cypressJson = jsonParse(fileContent);
    expect(cypressJson.supportFile).toBe(false);

    const options: IHelperSchema = {
      name: 'applitools',
      target: 'web-foo',
    };
    // console.log('appTree:', appTree);
    const tree = await runSchematic('helpers', options, appTree);
    const files = tree.files;
    // console.log(files);

    expect(
      files.indexOf('/apps/web-foo-e2e/src/support/index.ts')
    ).toBeGreaterThanOrEqual(0);
    expect(
      files.indexOf('/apps/web-foo-e2e/src/plugins/index.ts')
    ).toBeGreaterThanOrEqual(0);
    // modified testing files
    let filePath = '/apps/web-foo-e2e/src/support/index.ts';
    fileContent = getFileContent(tree, filePath);
    // console.log(fileContent);

    expect(
      fileContent.indexOf('@applitools/eyes-cypress/commands')
    ).toBeGreaterThanOrEqual(0);

    filePath = '/apps/web-foo-e2e/src/plugins/index.ts';
    fileContent = getFileContent(tree, filePath);
    // console.log(fileContent);

    expect(
      fileContent.indexOf(`require('@applitools/eyes-cypress')(module);`)
    ).toBeGreaterThanOrEqual(0);

    fileContent = getFileContent(tree, cypressJsonPath);
    // console.log(fileContent);
    cypressJson = jsonParse(fileContent);
    expect(cypressJson.supportFile).toBe(`./src/support/index.js`);

    filePath = '/apps/web-foo-e2e/src/integration/app.spec.ts';
    fileContent = getFileContent(tree, filePath);
    // console.log(fileContent);

    expect(fileContent.indexOf(`eyesOpen`)).toBeGreaterThanOrEqual(0);
  });

  it('applitools: should throw if target is missing', async () => {
    // const optionsXplat: XPlatOptions = {
    //   npmScope: 'testing',
    //   prefix: 'tt',
    //   platforms: 'web,nativescript'
    // };

    // appTree = schematicRunner.runSchematic('xplat', optionsXplat, appTree);
    const appOptions: AppWebOptions = {
      name: 'foo',
      prefix: 'tt',
      e2eTestRunner: 'cypress',
      useXplat: false,
    };
    // console.log('appTree:', appTree);
    appTree = await runSchematic('app', appOptions, appTree);

    const cypressJsonPath = '/apps/web-foo-e2e/cypress.json';
    let fileContent = getFileContent(appTree as UnitTestTree, cypressJsonPath);
    let cypressJson = jsonParse(fileContent);
    expect(cypressJson.supportFile).toBe(false);

    const options: IHelperSchema = {
      name: 'applitools',
    };
    // console.log('appTree:', appTree);

    await expect(runSchematic('helpers', options, appTree)).rejects.toThrow(
      `The helper "applitools" requires the --target flag.`
    );
  });
});
