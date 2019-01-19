import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const fsExists = promisify(fs.exists);
const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);

export async function updateConfig() {
  const cwd = process.cwd();
  if (cwd.indexOf('node_modules/@nstudio/schematics') === -1) {
    // ignore: local development
    return;
  }

  const ngCliConfigPath = path.join(process.cwd(), '/../../..', 'angular.json');
  // console.log(ngCliConfigPath);
  try {
    const config = fs.readFileSync(ngCliConfigPath, 'UTF-8');
    if (config) {
      const ngCli = JSON.parse(config);
      // update default
      ngCli.cli.defaultCollection = "@nstudio/schematics";
      fs.writeFileSync(ngCliConfigPath, JSON.stringify(ngCli, null, 2));
    }
  } catch (err) {
    console.warn('An issue was detected during installation: angular.json does not exist.');
  }

  try {
    // Prevent Nrwl formatter from walking into {N} platforms folder
    await fixFormatter();
  } catch (err) {
    console.error('An issue were detected during patching the nx-formatter', err);
  }

  try {
    await makePrettierIgnore()
  } catch (err) {
    console.error('An issue were detected during patching the nx-formatter', err);
  }
}

/**
 * @nrwl/nx's formatter doesn't include files in the xplat-folder.
 * This function patches their formatter cli to include the xplat-folder
 */
export async function fixFormatter() {
  const formatPath = path.join(process.cwd(), '/../..', '@nrwl/schematics/src/command-line/format.js');
  let formatContent = await fsReadFile(formatPath, 'UTF-8');

  const patchLine = `    // PATCHED by @nstudio/schematics\n    patterns.push('"xplat/**/*"');`;
  if (formatContent.indexOf(patchLine) !== -1) {
    console.log(`Patch for nx format have already been applied`);
    return;
  }

  const patchRegExp = /(^\s+var chunkList)/m;
  if (!patchRegExp.test(formatContent)) {
    throw new Error(`Apply couldn't patch for nx format`);
  }

  const newFormatContent = formatContent.replace(patchRegExp, `${patchLine}\n$1`);
  if (formatContent !== newFormatContent) {
    await fsWriteFile(formatPath, newFormatContent);
    console.log('Patch for nx format have been applied');
  } else {
    throw new Error(`Apply couldn't patch for nx format`);
  }
}

/**
 * To avoid @nrwl/nx's formatter tries to format App_Resources, platforms-files etc.
 * Create a .prettierignore file at the root of the project.
 */
export async function makePrettierIgnore() {
  const prettierIgnorePath = path.join(process.cwd(), '/../..', '.prettierignore');

  const prettierIgnore = `**/*.d.ts
apps/**/platforms/{android,ios}/**/*
**/App_Resources/**/*
apps/nativescript-*/tools/**/*
**/webpack.config.js
**/package.json
**/package-lock.json
**/tslint.json
**/tsconfig.*.json
**/tsconfig.json
**/*.conf.js
`;

  if (!await fsExists(prettierIgnorePath)) {
    console.log(`"${prettierIgnorePath}" already exists`);
    return;
  }

  await fsWriteFile(prettierIgnorePath, prettierIgnore, 'UTF-8');
}

updateConfig();
