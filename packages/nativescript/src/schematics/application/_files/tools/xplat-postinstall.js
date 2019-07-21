//#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// Copy potential hooks from root dependencies to app
const hooksSrc = '../../hooks';
const hooksDest = 'hooks';
console.info(`Copying ${hooksSrc} -> ${hooksDest}`);
try {
  fs.copySync(hooksSrc, hooksDest);
} catch (err) {
  // ignore
}
