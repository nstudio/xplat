#!/usr/bin/env bash
##################################################
# This shell script is executed by xplat-release.js #
##################################################

XPLAT_VERSION=$1
PACKAGE_VERSION=$2

if [[ $XPLAT_VERSION == "--local" ]]; then
    XPLAT_VERSION="*"
fi

./scripts/build.sh

cd build/packages

if [[ "$OSTYPE" == "darwin"* ]]; then

    if [[ $PACKAGE_VERSION =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
      # override package version
      sed -i "" "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$PACKAGE_VERSION';|g" {angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/src/utils/versions.js
      sed -i "" "s|\0.0.1|$PACKAGE_VERSION|g" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
    else 
      sed -i "" "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/src/utils/versions.js
      sed -i "" "s|\*|$XPLAT_VERSION|g" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
    fi
else
    sed -i "s|exports.xplatVersion = '\*';|exports.xplatVersion = '$XPLAT_VERSION';|g" {angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/src/utils/versions.js
    sed -i "s|\*|$XPLAT_VERSION|g" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
fi

if [[ $XPLAT_VERSION == "*" ]]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if [[ $PACKAGE_VERSION =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
          # override package version
          sed -E -i "" "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"$PACKAGE_VERSION\"/" {schematics,angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
        else 
          sed -E -i "" "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"file:..\/\1\"/" {angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
        fi
    else
        sed -E -i "s/\"@nstudio\/([^\"]+)\": \"\\*\"/\"@nstudio\/\1\": \"file:..\/\1\"/" {angular,electron,electron-angular,focus,ionic,ionic-angular,nativescript,nativescript-angular,web,web-angular,xplat,xplat-utils}/package.json
    fi
fi
