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
