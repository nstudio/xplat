#!/usr/bin/env bash

if [ -n "$1" ]; then
  if [ -n "$2" ]; then
    # /usr/bin/open chrome://inspect
    node --inspect-brk node_modules/.bin/jest --runInBand ./build/packages/$1.spec.js
  else
    jest --maxWorkers=1 --detectLeaks ./build/packages/$1.spec.js
  fi
else
  jest --runInBand ./build/packages/{angular,electron,electron-angular,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat} --passWithNoTests
fi
