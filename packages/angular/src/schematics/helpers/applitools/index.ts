import { Tree, SchematicContext, noop } from '@angular-devkit/schematics';
import {
  updatePackageScripts,
  IHelperConfig,
  IHelperSchema,
} from '@nstudio/xplat';
import {
  getJsonFromFile,
  updateJsonFile,
  PlatformTypes,
  isTesting,
  updateFile,
} from '@nstudio/xplat-utils';

export const config: IHelperConfig = {
  requiresTarget: true,
  additionalSupport: applitools,
  logNotes: note,
};

function applitools(helperChains: Array<any>, options: IHelperSchema) {
  return (tree: Tree, context: SchematicContext) => {
    // update support index
    helperChains.push(
      updateFile(
        tree,
        `/apps/${options.target}-e2e/src/support/index.ts`,
        updateCypressIndex()
      )
    );
    // update plugin index
    helperChains.push(
      updateFile(
        tree,
        `/apps/${options.target}-e2e/src/plugins/index.ts`,
        updateCypressPlugins()
      )
    );
    // ensure supportFile points to updates
    const cypressConfigPath = `/apps/${options.target}-e2e/cypress.json`;
    const cypressConfig = getJsonFromFile(tree, cypressConfigPath);
    // console.log('cypressConfig:', cypressConfig);
    // plugin path is always defined so ensure support matches
    const pluginsFilePath = cypressConfig.pluginsFile;
    // console.log('pluginsFilePath:', pluginsFilePath);
    const outputPath = pluginsFilePath.split('plugins/')[0];
    cypressConfig.supportFile = `${outputPath}support/index.js`;
    // console.log('cypressConfig.supportFile:', cypressConfig.supportFile);
    helperChains.push(updateJsonFile(tree, cypressConfigPath, cypressConfig));

    // Add applitools modules
    const packageJson = getJsonFromFile(tree, 'package.json');
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies['@applitools/eyes-cypress'] = '^3.7.1';
    helperChains.push(updateJsonFile(tree, 'package.json', packageJson));

    // update sample test
    helperChains.push(
      updateFile(
        tree,
        `/apps/${options.target}-e2e/src/integration/app.spec.ts`,
        updateSampleTest()
      )
    );
  };
}

function note(options: IHelperSchema) {
  if (!isTesting()) {
    console.log(`Applitools support added for: ${options.target}`);
    console.log(
      `Ensure your APPLITOOLS_API_KEY environment variable is set: https://applitools.com/tutorials/cypress.html#step-by-step-guide-run-the-demo-app`
    );
  }
}

function updateCypressIndex() {
  return `// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Applitools support
import '@applitools/eyes-cypress/commands';

// Import commands.js using ES2015 syntax:
import './commands';  
`;
}

function updateCypressPlugins() {
  return `// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

module.exports = (on: any, config: any) => {
  // 'on' is used to hook into various events Cypress emits
  // 'config' is the resolved Cypress config
};

// Applitools
require('@applitools/eyes-cypress')(module);  
`;
}

function updateSampleTest() {
  return `import { getGreeting } from '../support/app.po';
import { eyesOpen, eyesCheckWindow, eyesClose } from '@applitools/eyes-cypress';

describe('Hello Nx', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {

    // start applitools test
    eyesOpen({
      appName: 'myapp',
      testName: 'Welcome message',
      browser: { width: 800, height: 600 },
    });

    // check window with applitools
    eyesCheckWindow('Main Page');

    // standard cypress testing
    getGreeting().contains('Welcome to web-myapp!');

    // end applitools test
    eyesClose();
  });
});  
`;
}
