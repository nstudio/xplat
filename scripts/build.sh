#!/usr/bin/env bash
rm -rf build

#xplat client side lib
mkdir build
mkdir build/packages

echo "Compiling Typescript..."
./node_modules/.bin/tsc
echo "Compiled Typescript"

rsync -a --exclude=*.ts packages/ build/packages

rm -rf build/packages/install
cp README.md build/packages/angular
cp README.md build/packages/electron
cp README.md build/packages/electron-angular
cp README.md build/packages/ionic
cp README.md build/packages/ionic-angular
cp README.md build/packages/nativescript
cp README.md build/packages/nativescript-angular
cp README.md build/packages/schematics
cp README.md build/packages/web
cp README.md build/packages/web-angular
cp README.md build/packages/xplat
cp LICENSE build/packages/angular
cp LICENSE build/packages/electron
cp LICENSE build/packages/electron-angular
cp LICENSE build/packages/ionic
cp LICENSE build/packages/ionic-angular
cp LICENSE build/packages/nativescript
cp LICENSE build/packages/nativescript-angular
cp LICENSE build/packages/schematics
cp LICENSE build/packages/web
cp LICENSE build/packages/web-angular
cp LICENSE build/packages/xplat

echo "xplat libraries available at build/packages:"
ls build/packages
