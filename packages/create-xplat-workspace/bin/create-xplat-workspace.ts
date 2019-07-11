#!/usr/bin/env node

import { execSync } from 'child_process';
import * as path from 'path';
import * as yargsParser from 'yargs-parser';

const parsedArgs = yargsParser(process.argv, {
  string: ['directory', 'prefix', 'targets'],
  boolean: ['yarn', 'bazel', 'help']
});

const { help, prefix, targets } = parsedArgs;
const directory = parsedArgs._[2] && path.resolve(parsedArgs._[2]);
const showHelp = help || !directory || !prefix;
if (showHelp) {
  if (!directory) {
    console.log(`directory is required`);
  }

  if (!prefix) {
    console.log(`--prefix=PREFIX is required`);
  }

  console.log(`
    Usage: create-xplat-workspace <directory> [options] [ng new options]
    Create a new Nx workspace (that is to say a new angular-cli project using @nrwl/workspace)
    Options:
      directory             path to the workspace root directory (required)
      --yarn                use yarn instead of npm (default to false)
      --bazel               use bazel instead of webpack (default to false)
      --prefix=PREFIX       xplat prefix (required)
      --platforms=          Platform support: specify specific platforms to supports (web,nativescript,ionic,electron)
      [ng new options]      any 'ng new' options
                            run 'ng new --help' for more information
  `);
  process.exit(0);
}

const workspaceArgs = [...process.argv.slice(2).map(a => `${a}`)]
  .join(' ')
  .replace(`--platforms=${targets || ''}`, '') // Don't propagate --platforms to create-nx-workspace
  .replace(`--platforms ${targets || ''}`, '')
  .replace(`--prefix=${prefix}`, '') // Don't propagate --prefix to create-nx-workspace
  .replace(`--prefix ${prefix}`, '');

const createNXWorkspaceCmd = `npx create-nx-workspace@latest ${workspaceArgs}`;
console.log(createNXWorkspaceCmd);
execSync(createNXWorkspaceCmd, { stdio: [0, 1, 2] });

const installXplatCmd = `npm install -D @nstudio/xplat`;
console.log(installXplatCmd);
execSync(installXplatCmd, { cwd: directory, stdio: [0, 1, 2] });

let setupXplat = `${path.join(
  'node_modules',
  '.bin',
  'ng'
)} g xplat --prefix=${prefix} --platforms=${targets}`;
console.log(setupXplat);
execSync(setupXplat, { cwd: directory, stdio: [0, 1, 2] });

const gitPathsToAdd = [
  '.vscode/settings.json',
  '.gitignore',
  '.editorconfig',
  '.prettierignore',
  '.prettierrc',
  'angular.json',
  'nx.json',
  'libs/core',
  'libs/features',
  'libs/scss',
  'libs/utils',
  'references.d.ts',
  'xplat',
  'testing',
  'angular.json',
  'nx.json',
  'package-lock.json',
  'package.json',
  'tsconfig.json',
  'tslint.json'
];

const gitAdd = `git add ${gitPathsToAdd.join(
  ' '
)} && git commit -m "Installed @nstudio/xplat"`;
console.log(gitAdd);
execSync(gitAdd, { cwd: directory, stdio: [0, 1, 2] });
