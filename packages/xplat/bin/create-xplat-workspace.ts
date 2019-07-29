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
const showHelp = help || !directory;
if (showHelp) {
  if (!directory) {
    console.log(`directory is required`);
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

let workspaceArgs = [...process.argv.slice(2).map(a => `${a}`)].join(' ');

if (targets) {
  workspaceArgs = workspaceArgs
    .replace(`--platforms=${targets || ''}`, '') // Don't propagate --platforms to create-nx-workspace
    .replace(`--platforms ${targets || ''}`, '');
}
if (prefix) {
  workspaceArgs = workspaceArgs
    .replace(`--prefix=${prefix}`, '') // Don't propagate --prefix to create-nx-workspace
    .replace(`--prefix ${prefix}`, '');
}

const createNXWorkspaceCmd = `npx --ignore-existing create-nx-workspace@latest ${workspaceArgs}`;
console.log(createNXWorkspaceCmd);
execSync(createNXWorkspaceCmd, { stdio: [0, 1, 2] });

const installXplatCmd = `npm install -D @nstudio/xplat`;
console.log(installXplatCmd);
execSync(installXplatCmd, { cwd: directory, stdio: [0, 1, 2] });

let setupXplat = `npx nx g @nstudio/xplat:init`;
if (targets) {
  setupXplat = `${setupXplat} --platforms=${targets}`;
}
if (prefix) {
  setupXplat = `${setupXplat} --prefix=${prefix}`;
}
console.log(setupXplat);
execSync(setupXplat, { cwd: directory, stdio: [0, 1, 2] });

const gitAdd = `git add . && git commit -m "chore: setup workspace with @nstudio/xplat"`;
console.log(gitAdd);
execSync(gitAdd, { cwd: directory, stdio: [0, 1, 2] });
