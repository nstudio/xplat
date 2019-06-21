#!/usr/bin/env node

import { execSync } from 'child_process';
import { dirSync } from 'tmp';
import { writeFileSync } from 'fs';
import * as path from 'path';
import * as yargsParser from 'yargs-parser';

const parsedArgs = yargsParser(process.argv, {
  string: ['directory'],
  boolean: ['help']
});

if (parsedArgs.help) {
  console.log(`
    Usage: create-xplat-workspace <directory> [options] [ng new options]

    Create a new xplat workspace

    Options:

      directory             path to the workspace root directory

      [ng new options]      any 'ng new' options
                            run 'ng new --help' for more information
  `);
  process.exit(0);
}

const xplatTool = {
  name: 'Schematics',
  packageName: '@nstudio/workspace'
};

let packageManager: string;
try {
  packageManager = execSync('ng config -g cli.packageManager', {
    stdio: ['ignore', 'pipe', 'ignore']
  })
    .toString()
    .trim();
} catch (e) {
  packageManager = 'yarn';
}
try {
  execSync(`${packageManager} --version`, {
    stdio: ['ignore', 'ignore', 'ignore']
  });
} catch (e) {
  packageManager = 'npm';
}

const projectName = parsedArgs._[2];

// check that the workspace name is passed in
if (!projectName) {
  console.error(
    'Please provide a project name (e.g., create-xplat-workspace xplat-proj)'
  );
  process.exit(1);
}

// creating the sandbox
console.log(`Creating a sandbox with Nx + xplat...`);
const tmpDir = dirSync().name;

const xplatVersion = 'XPLAT_VERSION';
const nxVersion = 'NX_VERSION';
const cliVersion = 'ANGULAR_CLI_VERSION';
const typescriptVersion = 'TYPESCRIPT_VERSION';

writeFileSync(
  path.join(tmpDir, 'package.json'),
  JSON.stringify({
    dependencies: {
      [xplatTool.packageName]: xplatVersion,
      '@nrwl/workspace': nxVersion,
      '@angular/cli': cliVersion,
      typescript: typescriptVersion
    },
    license: 'MIT'
  })
);

execSync(`${packageManager} install --silent`, {
  cwd: tmpDir,
  stdio: [0, 1, 2]
});

// creating the app itself
const args = process.argv
  .slice(2)
  .map(a => `"${a}"`)
  .join(' ');
console.log(`ng new ${args} --collection=${xplatTool.packageName}`);
execSync(
  `"${path.join(
    tmpDir,
    'node_modules',
    '.bin',
    'ng'
  )}" new ${args} --collection=${xplatTool.packageName}`,
  {
    stdio: [0, 1, 2]
  }
);
