#!/usr/bin/env bash
rm -rf build

#xplat client side lib
mkdir build
mkdir build/packages

echo "Compiling Typescript..."
./node_modules/.bin/tsc
echo "Compiled Typescript"

rsync -a --exclude=*.ts packages/ build/packages

chmod +x build/packages/workspace/bin/create-xplat-workspace.js
chmod +x build/packages/create-xplat-workspace/bin/create-xplat-workspace.js
rm -rf build/packages/install
cp README.md build/packages/angular
cp README.md build/packages/create-xplat-workspace
cp README.md build/packages/electron
cp README.md build/packages/ionic
cp README.md build/packages/nativescript
cp README.md build/packages/schematics
cp README.md build/packages/web
cp README.md build/packages/workspace
cp LICENSE build/packages/angular
cp LICENSE build/packages/create-xplat-workspace
cp LICENSE build/packages/electron
cp LICENSE build/packages/ionic
cp LICENSE build/packages/nativescript
cp LICENSE build/packages/schematics
cp LICENSE build/packages/web
cp LICENSE build/packages/workspace

echo "xplat libraries available at build/packages:"
ls build/packages
