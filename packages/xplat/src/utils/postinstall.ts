import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const fsExists = promisify(fs.exists);
const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);

export async function updateConfig() {
  const cwd = process.cwd();
  // console.log('cwd:', cwd);
  if (
    cwd.indexOf('node_modules/@nstudio/xplat') === -1 &&
    cwd.indexOf('node_modules\\@nstudio\\xplat') === -1
  ) {
    // ignore: local development
    return;
  }

  // console.log(process.cwd());
  const ngCliConfigPath = path.join(process.cwd(), '/../../..', 'angular.json');
  // console.log(ngCliConfigPath);
  try {
    const config = fs.readFileSync(ngCliConfigPath, 'UTF-8');
    if (config) {
      const ngCli = JSON.parse(config);
      // update default
      ngCli.cli.defaultCollection = '@nstudio/xplat';
      fs.writeFileSync(ngCliConfigPath, JSON.stringify(ngCli, null, 2));
    }
  } catch (err) {
    console.warn(
      'An issue was detected during installation: angular.json does not exist.'
    );
  }

  try {
    // Prevent Nrwl formatter from walking into {N} platforms folder
    await fixFormatter();
  } catch (err) {
    console.error(
      'An issue were detected during patching the nx-formatter',
      err
    );
  }

  try {
    await makePrettierIgnore();
  } catch (err) {
    console.error(
      'An issue were detected during patching the nx-formatter',
      err
    );
  }
}

/**
 * @nrwl/workspace formatter doesn't include files in the xplat-folder.
 * This function patches their formatter cli to include the xplat-folder
 */
export async function fixFormatter() {
  const formatPath = path.join(
    process.cwd(),
    '/../..',
    '@nrwl/workspace/src/command-line/format.js'
  );
  let formatContent = await fsReadFile(formatPath, 'UTF-8');

  const patchLine = `    // PATCHED by @nstudio/xplat\n    patterns.push('"xplat/**/*"');`;
  if (formatContent.indexOf(patchLine) !== -1) {
    console.log(`Patch for nx format have already been applied`);
    return;
  }

  const patchRegExp = /(^\s+var chunkList)/m;
  if (!patchRegExp.test(formatContent)) {
    throw new Error(`Apply couldn't patch for nx format`);
  }

  const newFormatContent = formatContent.replace(
    patchRegExp,
    `${patchLine}\n$1`
  );
  if (formatContent !== newFormatContent) {
    await fsWriteFile(formatPath, newFormatContent);
    console.log('Patch for nx format have been applied');
  } else {
    throw new Error(`Apply couldn't patch for nx format`);
  }
}

/**
 * To avoid @nrwl/workspace formatter tries to format App_Resources, platforms-files etc.
 * Create a .prettierignore file at the root of the project.
 */
export async function makePrettierIgnore() {
  const prettierIgnorePath = path.join(
    process.cwd(),
    '/../../..',
    '.prettierignore'
  );

  const prettierIgnore = `.DS_Store
**/*.d.ts
**/apps/**/platforms/**/*
**/App_Resources/**/*
**/apps/nativescript*/hooks/**/*
**/apps/nativescript*/tools/**/*
**/apps/nativescript*/src/assets/*.min.css
**/apps/*nativescript/hooks/**/*
**/apps/*nativescript/tools/**/*
**/apps/*nativescript/src/assets/*.min.css
**/xplat/nativescript*/plugins/**/*
**/webpack.config.js
**/package.json
**/package-lock.json
**/tslint.json
**/tsconfig.*.json
**/tsconfig.json
**/*.conf.js
**/xplat/**/.xplatframework
`;

  if (!(await fsExists(prettierIgnorePath))) {
    console.log(`"${prettierIgnorePath}" already exists`);

    // determine if extra rules are needed
    let prettierContent = await fsReadFile(prettierIgnorePath, 'UTF-8');
    if (prettierContent.indexOf('**/apps/**/platforms/**/*') === -1 || prettierContent.indexOf('**/xplat/**/.xplatframework') === -1) {
      console.log(`xplat is updating "${prettierIgnorePath}" with a few important extra rules. You may double-check the contents afterwards to ensure they meet your satisfaction`);
      // update prettier to include the rules
      await fsWriteFile(prettierIgnorePath, prettierContent + '\n' + prettierIgnore, 'UTF-8');
    }
    return;
  }

  await fsWriteFile(prettierIgnorePath, prettierIgnore, 'UTF-8');
}

updateConfig();
