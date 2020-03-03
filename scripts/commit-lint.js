#!/usr/bin/env node

console.log('🚀🚀🚀 Validating git commit message 🚀🚀🚀');
const gitMessage = require('child_process')
  .execSync('git log -1 --no-merges')
  .toString()
  .trim();

const matchCommit = /(chore|feat|fix|cleanup|docs)\((angular|core|docs|electron|ionic|nativescript|node|platform|testing|repo|misc)\):\s(([a-z0-9:\-\s])+)/g.test(
  gitMessage
);
const matchRevert = /Revert/gi.test(gitMessage);
const matchRelease = /Release/gi.test(gitMessage);
const exitCode = +!(matchRelease || matchRevert || matchCommit);

if (exitCode === 0) {
  console.log('Commit ACCEPTED 👌');
} else {
  console.log(
    '[Error]: Ho no! 😦 Your commit message: \n' +
      '-------------------------------------------------------------------\n' +
      gitMessage +
      '\n-------------------------------------------------------------------' +
      '\n\n 👉️ Does not follow the commit message convention specified in the CONTRIBUTING.MD file.'
  );
  console.log('\ntype(scope): subject \n BLANK LINE \n body');
  console.log('\n');
  console.log('possible types: chore|feat|fix|cleanup|docs');
  console.log(
    'possible scopes: angular|core|docs|electron|ionic|nativescript|node|platform|testing|repo|misc (if unsure use "core")'
  );
  console.log('\nEXAMPLE: \n' + 'feat(platform): add a Vue app generator\n');
}
process.exit(exitCode);
