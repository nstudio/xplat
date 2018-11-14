import * as fs from 'fs';
import * as path from 'path';

export function updateConfig() {
  const cwd = process.cwd();
  if (cwd.indexOf('xplat/schematics') > -1) {
    // ignore: local development
  } else {
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
  }

  try {
    // Prevent Nrwl formatter from walking into {N} platforms folder
    fixFormatter();
  } catch (err) {
    console.log('An issue were detected during patching the nx-formatter', err);
  }
}

updateConfig();

export function fixFormatter() {
  const formatPath = path.join(process.cwd(), '/../..', '@nrwl/schematics/src/command-line/format.js');
  let formatContent = fs.readFileSync(formatPath, 'UTF-8');

  const patchLine = `    // PATCHED by @nstudio/schematics\n    patterns.push('"xplat/**/*.ts"', '"!apps/**/platforms/{android,ios}/**/*"');`;
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
    fs.writeFileSync(formatPath, newFormatContent);
    console.log('Patch for nx format have been applied');
  } else {
    throw new Error(`Apply couldn't patch for nx format`);
  }
}

