//#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');

// Copy potential hooks from root dependencies to app
const hooksSrc = '<%= pathOffset %>hooks';
const hooksDest = 'hooks';
console.info(`Copying ${hooksSrc} -> ${hooksDest}`);
try {
  fs.copySync(hooksSrc, hooksDest);
} catch (err) {
  // ignore
}

// Helpful to trigger ngcc after an install to ensure all has processed properly
const child = childProcess.spawn(/^win/.test(process.platform) ? '<%= pathOffsetWindows %>node_modules\\.bin\\ngcc' : '<%= pathOffset %>node_modules/.bin/ngcc', ['--tsconfig', 'tsconfig.app.json', '--properties', 'es2015', 'module', 'main', '--first-only'], {
  cwd: process.cwd(),
  stdio: 'inherit',
});
child.on('close', (code) => {

});
