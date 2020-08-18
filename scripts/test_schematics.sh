#!/usr/bin/env bash

if [ -n "$1" ]; then
  if [ -n "$2" ]; then
    # /usr/bin/open chrome://inspect
    node --inspect-brk node_modules/.bin/jest --runInBand ./build/packages/$1.spec.js
  else
    jest --maxWorkers=1 ./build/packages/$1.spec.js
  fi
else
  jest --maxWorkers=1 ./build/packages/{angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils} --passWithNoTests
fi
