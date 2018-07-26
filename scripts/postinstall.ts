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

        // Prevent Nrwl formatter from walking into {N} platforms folder
        fixFormatter();
      }
    } catch (err) {
      console.warn('An issue was detected during installation: angular.json does not exist.');
    }
  }
}

updateConfig();

export function fixFormatter() {
  const formatPath = path.join(process.cwd(), '/../..', '@nrwl/schematics/src/command-line/format.js');
  let formatContent = fs.readFileSync(formatPath, 'UTF-8');

  // Old patch line, globs should've been wrapped in quotes.
  const oldPatchLine = `    patterns.push("xplat\/**\/*.ts", "!apps/**/platforms/{android,ios}/**/*.ts");`;
  const patchLine = `    patterns.push("\"xplat\/**\/*.ts\"", "\"!apps/**/platforms/{android,ios}/**/*.ts\"");`;
  if (formatContent.indexOf(oldPatchLine) !== -1) {
    console.log('Old patch for nx format have been applied, replace with new patch');
    fs.writeFileSync(formatPath, formatContent.replace(oldPatchLine, patchLine));
    return;
  }

  if (formatContent.indexOf(patchLine) !== -1) {
    console.log(`Patch for nx format have already been applied`);
    return;
  }

  const patchRegExp = /(}\n)(^\s+switch \(command\) {)/m;
  if (!patchRegExp.test(formatContent)) {
    throw new Error(`Apply couldn't patch for nx format`);
  }

  const newFormatContent = formatContent.replace(patchRegExp, `$1\n${patchLine}\n$2`);
  if (formatContent !== newFormatContent) {
    fs.writeFileSync(formatPath, newFormatContent);
    console.log('Patch for nx format have been applied');
  } else {
    throw new Error(`Apply couldn't patch for nx format`);
  }
}

