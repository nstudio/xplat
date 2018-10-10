const glob = require('glob');
const path = require('path');
const fs = require('fs');
const rootPkg = require('../../../../package.json');
const converter = require('nativescript-dev-sass/lib/converter');

const removeDotTsRegexp = /\.ts$/;
function makeImportPath(nodeModulesPath, filepath) {
  return path
    .relative(nodeModulesPath, filepath)
    .replace(removeDotTsRegexp, "");
}

function writeImportFile(outputFilePath, imports) {
  fs.writeFileSync(outputFilePath, imports.join(`\n`), "UTF-8");
}

module.exports = function($logger, $projectData) {
  const nodeModulesPath = path.join($projectData.projectDir, 'node_modules');
  const outputFilePath = path.join(
    $projectData.appDirectoryPath,
    'tests',
    'import.spec.ts'
  );

  if (!rootPkg.name) {
    throw new Error("Couldn't find prefix");
  }
  const prefix = `@${rootPkg.name}`;
  const prefixModulePath = path.join(nodeModulesPath, prefix, 'nativescript');

  return new Promise(function(resolve, reject) {
    glob(
      path.join(prefixModulePath, '**', '*.spec.ts'),
      { symlinks: true },
      function(error, files) {
        if (error) {
          reject(error);
          return;
        }

        if (files && files.length) {
          const imports = files
            .map(filepath => makeImportPath(nodeModulesPath, filepath))
            .map(importPath => `import ${JSON.stringify(importPath)};`);

          writeImportFile(outputFilePath, imports);
        } else {
          writeImportFile(outputFilePath, []);
        }

        resolve();
      }
    );
  }).then(function() {
    // This is needed to compile stylesheet for components from @prefix/nativescript
    // nativescript-dev-sass only compiles the stylesheets under the app-path.
    return converter.convert(
      $logger,
      $projectData.projectDir,
      prefixModulePath,
      $projectData.appResourcesDirectoryPath
    );
  });
};
