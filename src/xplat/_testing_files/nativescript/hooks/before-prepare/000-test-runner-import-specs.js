const glob = require('glob');
const path = require('path');
const fs = require('fs');
const rootPkg = require('../../../../package.json');

const removeDotTsRegexp = /\.ts$/;
function makeImportPath(nodeModulesPath, filepath) {
  return path.relative(nodeModulesPath, filepath).replace(removeDotTsRegexp, '');
}

function writeImportFile(outputFilePath, imports) {
  fs.writeFileSync(outputFilePath, imports.join(`\n`), 'UTF-8');
}

module.exports = function(projectData) {
  const nodeModulesPath = path.join(projectData.projectDir, 'node_modules');
  const outputFilePath = path.join(projectData.appDirectoryPath, 'tests', 'import.spec.ts');

  if (!rootPkg.name) {
    throw new Error("Couldn't find prefix");
  }
  const prefix = `@${rootPkg.name}`;

  return new Promise(function(resolve, reject) {
    glob(path.join(nodeModulesPath, prefix, 'nativescript', '**', '*.spec.ts'), {symlinks: true}, function(error, files) {
      if (error) {
        reject(error);
        return;
      }

      if (files && files.length) {
        const imports = files
          .map((filepath) => makeImportPath(nodeModulesPath, filepath))
          .map((importPath) => `import ${JSON.stringify(importPath)};`);

        writeImportFile(outputFilePath, imports);
      } else {
        writeImportFile(outputFilePath, []);
      }

      resolve();
    });
  });
};
